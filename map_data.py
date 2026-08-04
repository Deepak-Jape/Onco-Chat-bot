"""Data for ctsearch's MapView (the population/density choropleth).

MapView takes `data` as [{lat, lng, name, population, density}] where density is
normalised 0-1 (see DENSITY_BANDS in ctsearch's populationMapPoints helper) and
drives the colour band; `cohortTotal` is the headline number in the legend.

Points are the real trial-site coordinates from facility_info -- 30,393 of
31,222 rows carry lat/long -- so density reflects actual site distribution
rather than a synthetic surface. Country population comes from population.csv
where a name match exists; it is only used for the hover label, never to invent
a density value.
"""

import csv
import io
import os
import re

from db import get_conn

_POP_CSV = os.path.join(os.path.dirname(os.path.abspath(__file__)), "population.csv")


_COUNTRY_RE = re.compile(r"^(.*?)\s*\(\s*([A-Za-z]{2,3})\s*\)\s*$")


def _clean_country(name):
    """'United States ( USA )' -> 'United States'."""
    return re.sub(r"\s*\([^)]*\)\s*$", "", str(name or "")).strip()


def _country_and_iso3(raw):
    """'Taiwan ( TWN )' -> ('Taiwan', 'TWN'). No code in parens -> (name, None)."""
    m = _COUNTRY_RE.match(str(raw or ""))
    if m:
        return m.group(1).strip(), m.group(2).upper()
    return str(raw or "").strip(), None


def _population_by_country():
    """iso3 -> population, plus a lowercase-name fallback for rows with no code."""
    by_iso3, by_name = {}, {}
    try:
        with io.open(_POP_CSV, encoding="utf-8", errors="replace") as fh:
            for row in csv.DictReader(fh):
                name, iso3 = _country_and_iso3(row.get("country"))
                try:
                    pop = int(row.get("population_in_number") or 0)
                except (TypeError, ValueError):
                    continue
                if iso3:
                    by_iso3[iso3] = pop
                by_name[name.lower()] = pop
    except OSError:
        pass
    return by_iso3, by_name


_country_names_cache = None


def _known_country_names():
    """Proper-case country names from population.csv, longest first so e.g.
    'United States' is tried before a shorter name that might substring-match."""
    global _country_names_cache
    if _country_names_cache is None:
        names = []
        try:
            with io.open(_POP_CSV, encoding="utf-8", errors="replace") as fh:
                for row in csv.DictReader(fh):
                    name, _ = _country_and_iso3(row.get("country"))
                    if name:
                        names.append(name)
        except OSError:
            pass
        _country_names_cache = sorted(set(names), key=len, reverse=True)
    return _country_names_cache


def _country_in_question(question):
    """First known country name mentioned in the question, or None. Whole-word
    matched so e.g. 'China' doesn't fire on an unrelated substring."""
    q = str(question or "")
    for name in _known_country_names():
        if re.search(rf"\b{re.escape(name)}\b", q, re.IGNORECASE):
            return name
    return None


def build_country_site_map(country_name, oncosuite_ids=None, limit=3000):
    """City-level points within ONE country, for MapView's Voronoi country mode.

    Every point shares the same countryName/iso3 (so activeCountryName/activeIso3
    resolve) but `name` is the city, not the country -- if name == countryName on
    any point, MapView's isGlobalMode check fires and this renders as the world
    choropleth instead of zooming into the country.
    """
    where = [
        "f.latitude IS NOT NULL", "f.longitude IS NOT NULL",
        "f.country ILIKE %s",
    ]
    params = [f"{country_name}%"]
    if oncosuite_ids:
        where.append("f.oncosuite_id IN %s")
        params.append(tuple(oncosuite_ids))

    sql = f"""
        SELECT f.latitude, f.longitude, MIN(f.city) AS city, MIN(f.country) AS country,
               COUNT(*) AS sites, COUNT(DISTINCT f.oncosuite_id) AS trials
          FROM oncosuite_gold.facility_info f
         WHERE {' AND '.join(where)}
         GROUP BY f.latitude, f.longitude
         ORDER BY trials DESC, sites DESC
         LIMIT %s
    """
    params.append(limit)

    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(sql, tuple(params))
        rows = cur.fetchall()

    if not rows:
        return None

    pop_by_iso3, pop_by_name = _population_by_country()
    peak = max((int(r[5] or 0) for r in rows), default=0) or 1

    points = []
    resolved_name, resolved_iso3 = None, None
    for lat, lon, city, country_raw, sites, trials in rows:
        name, iso3 = _country_and_iso3(country_raw)
        resolved_name, resolved_iso3 = name, iso3
        points.append({
            "lat": float(lat),
            "lng": float(lon),
            "name": city or name,
            "countryName": name,
            "iso3": iso3,
            "population": (pop_by_iso3.get(iso3) if iso3 else None) or pop_by_name.get(name.lower()) or int(sites or 0),
            # MapView's fill colour is driven by `intensity` on a 0-10 scale
            # (see intensityToColor); `density` (0-1) is a separate field it
            # only reads for the hover tooltip's own "Population density" row.
            # Sending density alone leaves every point's intensity at its 0
            # default -- white/no-data -- even though the tooltip numbers are
            # correct.
            "density": round(min(1.0, (int(trials or 0) / peak)), 4),
            "intensity": round(min(10.0, (int(trials or 0) / peak) * 10), 2),
            "sites": int(sites or 0),
            "trials": int(trials or 0),
        })

    total_sites = sum(p["sites"] for p in points)
    return {
        "data": points,
        "cohortTotal": total_sites,
        "variant": "population",
        "legendTitle": f"Trial site density — {resolved_name or country_name}",
        "totalLabel": "trial sites",
    }


def build_map_points(oncosuite_ids=None, question="", limit=200):
    """One point per COUNTRY for MapView, or None when nothing is mappable.

    MapView renders in one of two modes: a world choropleth when every point
    carries an iso3 code (name == countryName), or a single-country Voronoi
    when every point is a city inside ONE country. Real trial sites span many
    countries at city granularity, matching neither mode -- grouping by
    country here is what makes the world-choropleth mode trigger instead of
    leaving the map stuck on its "waiting for a resolvable country" loading
    state forever.

    If the question names a specific country ("show trials in Germany"),
    delegate to build_country_site_map for the zoomed-in, city-level view
    instead of the global one.

    With `oncosuite_ids` the map is scoped to those trials' sites; without it,
    every geocoded site is used.
    """
    country = _country_in_question(question)
    if country:
        return build_country_site_map(country, oncosuite_ids)

    where, params = [
        "f.latitude IS NOT NULL", "f.longitude IS NOT NULL", "f.country IS NOT NULL",
    ], []
    if oncosuite_ids:
        where.append("f.oncosuite_id IN %s")
        params.append(tuple(oncosuite_ids))

    sql = f"""
        SELECT f.country, AVG(f.latitude) AS lat, AVG(f.longitude) AS lon,
               COUNT(*) AS sites, COUNT(DISTINCT f.oncosuite_id) AS trials
          FROM oncosuite_gold.facility_info f
         WHERE {' AND '.join(where)}
         GROUP BY f.country
         ORDER BY trials DESC, sites DESC
         LIMIT %s
    """
    params.append(limit)

    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(sql, tuple(params))
        rows = cur.fetchall()

    if not rows:
        return None

    pop_by_iso3, pop_by_name = _population_by_country()
    # Density is each country's trial count scaled against the busiest
    # country, so the 0-1 range the component expects reflects real relative
    # concentration.
    peak = max((int(r[4] or 0) for r in rows), default=0) or 1

    points = []
    for country_raw, lat, lon, sites, trials in rows:
        name, iso3 = _country_and_iso3(country_raw)
        population = (pop_by_iso3.get(iso3) if iso3 else None) or pop_by_name.get(name.lower()) or int(sites or 0)
        points.append({
            "lat": float(lat),
            "lng": float(lon),
            "name": name,
            "countryName": name,
            "iso3": iso3,
            "population": population,
            # See build_country_site_map's comment: MapView colours by
            # `intensity` (0-10), not `density` (0-1) -- both are sent so the
            # fill colour and the hover tooltip's own density row agree.
            "density": round(min(1.0, (int(trials or 0) / peak)), 4),
            "intensity": round(min(10.0, (int(trials or 0) / peak) * 10), 2),
            "sites": int(sites or 0),
            "trials": int(trials or 0),
        })

    total_sites = sum(p["sites"] for p in points)
    return {
        "data": points,
        "cohortTotal": total_sites,
        "variant": "population",
        # These points are trial-SITE density from facility_info, not real
        # epidemiological case counts (oncosuite_gold has no incidence data) --
        # MapView's legend defaults to "cases per year" for ctsearch's own
        # epidemiology use, so override it here rather than mislabel this data.
        "legendTitle": "Trial site density",
        "totalLabel": "trial sites",
    }


def build_country_summary(oncosuite_ids=None, limit=25):
    """Country-level rollup for the map's Table View toggle."""
    where, params = ["f.country IS NOT NULL"], []
    if oncosuite_ids:
        where.append("f.oncosuite_id IN %s")
        params.append(tuple(oncosuite_ids))

    sql = f"""
        SELECT f.country, COUNT(*) AS sites,
               COUNT(DISTINCT f.oncosuite_id) AS trials
          FROM oncosuite_gold.facility_info f
         WHERE {' AND '.join(where)}
         GROUP BY f.country
         ORDER BY trials DESC
         LIMIT %s
    """
    params.append(limit)

    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(sql, tuple(params))
        rows = cur.fetchall()

    if not rows:
        return None

    _, pop_by_name = _population_by_country()
    out = []
    for country, sites, trials in rows:
        label = _clean_country(country)
        pop = pop_by_name.get(label.lower())
        out.append({
            "country": label,
            "trials": int(trials or 0),
            "sites": int(sites or 0),
            # Left as None when population.csv has no row for the country --
            # the table shows a dash rather than a guessed figure.
            "population": pop,
        })
    return out


# ---------------------------------------------------------------------------
# Real cancer case-burden map (oncosuite_gold.map_view_population) -- unlike
# every builder above (trial-SITE density from facility_info), these points
# carry REAL epidemiology data: population, area and estimated annual new
# cancer cases per city/country. Kept separate from build_map_points so the
# two data sources are never conflated -- see CHART_SPECS in chart_data.py.
# ---------------------------------------------------------------------------

# Centroid + ISO3 for the ~20 countries in map_view_population's "Global"
# aggregate rows (country='Global', city=<country name>, no lat/lng of its
# own -- see the table's load script). Mirrors ctsearch's own
# COUNTRY_CENTER_COORDS/NAME_TO_ISO3 (populationMapPoints.jsx) so the two
# stay visually consistent; MapView drops any point without a finite
# lat/lng, so the global (no-country-named) view needs a fallback centroid.
_CASE_BURDEN_COUNTRY_CENTROIDS = {
    "australia": (-25.2744, 133.7751), "belgium": (50.5039, 4.4699),
    "brazil": (-14.235, -51.9253), "canada": (56.1304, -106.3468),
    "china": (35.8617, 104.1954), "france": (46.2276, 2.2137),
    "germany": (51.1657, 10.4515), "india": (20.5937, 78.9629),
    "italy": (41.8719, 12.5674), "japan": (36.2048, 138.2529),
    "netherlands": (52.1326, 5.2913), "poland": (51.9194, 19.1451),
    "russia": (61.524, 105.3188), "south korea": (35.9078, 127.7669),
    "spain": (40.4637, -3.7492), "switzerland": (46.8182, 8.2275),
    "turkey": (38.9637, 35.2433), "united kingdom": (55.3781, -3.436),
    "united states": (39.8283, -98.5795),
}
_CASE_BURDEN_NAME_TO_ISO3 = {
    "australia": "AUS", "belgium": "BEL", "brazil": "BRA", "canada": "CAN",
    "china": "CHN", "france": "FRA", "germany": "DEU", "india": "IND",
    "italy": "ITA", "japan": "JPN", "netherlands": "NLD", "poland": "POL",
    "russia": "RUS", "south korea": "KOR", "spain": "ESP",
    "switzerland": "CHE", "turkey": "TUR", "united kingdom": "GBR",
    "united states": "USA",
}

# Country area (km2), for computing country-level density in the global (no
# country named) view -- map_view_population's 'Global' rows carry no area of
# their own. Same source the CSV's own build script used.
_CASE_BURDEN_COUNTRY_AREA_KM2 = {
    "russia": 17098246, "canada": 9984670, "united states": 9833517,
    "china": 9596961, "brazil": 8515767, "australia": 7692024,
    "india": 3287263, "france": 551695, "spain": 505990, "japan": 377975,
    "germany": 357022, "poland": 312679, "italy": 301340,
    "united kingdom": 243610, "south korea": 100210, "netherlands": 41543,
    "switzerland": 41285, "belgium": 30689, "turkey": 783562,
}


def build_case_burden_country(country_name, limit=3000):
    """City-level real case-burden points within ONE named country."""
    sql = """
        SELECT latitude, longitude, city, country, case_ratio, city_population,
               city_area_km2, zipcode
          FROM oncosuite_gold.map_view_population
         WHERE country ILIKE %s AND city IS NOT NULL AND city <> ''
               AND latitude IS NOT NULL AND longitude IS NOT NULL
         ORDER BY case_ratio DESC NULLS LAST
         LIMIT %s
    """
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(sql, (country_name, limit))
        rows = cur.fetchall()

    if not rows:
        return None

    # Colour by DENSITY (cases per km2), not raw case count -- otherwise the
    # single biggest city dominates the peak and every other city washes out
    # to near-white, even ones with a genuinely high case rate for their size.
    densities = [float(cr) / float(area) for *_, cr, _, area, _ in rows
                if cr is not None and area]
    peak_density = max(densities, default=0) or 1
    resolved_country = rows[0][3]

    points = []
    total_cases = 0.0
    for lat, lon, city, _country, case_ratio, pop, area, zipcode in rows:
        cr = float(case_ratio) if case_ratio is not None else 0.0
        total_cases += cr
        area_f = float(area) if area is not None else None
        density = (cr / area_f) if (area_f and cr) else 0
        points.append({
            "lat": float(lat), "lng": float(lon), "name": city,
            "countryName": resolved_country,
            "iso3": _CASE_BURDEN_NAME_TO_ISO3.get(str(resolved_country).strip().lower()),
            "population": int(pop) if pop is not None else None,
            "caseCount": round(cr, 2), "caseRatio": round(cr, 2),
            "area": area_f,
            "density": round(density, 4),
            "intensity": round(min(10.0, (density / peak_density) * 10), 2) if density else 0,
            "zipcode": zipcode,
        })

    return {
        "data": points,
        "cohortTotal": round(total_cases),
        "variant": "population",
        "legendTitle": f"New cancer cases — {resolved_country}",
        "totalLabel": "cases per year",
    }


def build_case_burden_global(limit=200, only=None):
    """One point per country -- real annual new-case counts, world choropleth.

    `only`: optional list of country names (case-insensitive) to restrict the
    result to -- used when the question names SEVERAL countries ("Germany and
    China"), since MapView's city-level Voronoi mode only supports zooming
    into ONE country at a time; the world choropleth is the only mode that can
    show more than one, so a multi-country question falls back here instead
    of arbitrarily picking just the first name it saw.
    """
    sql = """
        SELECT city AS country, city_population AS population, case_ratio AS annual_cases
          FROM oncosuite_gold.map_view_population
         WHERE country = 'Global' AND city IS NOT NULL AND city <> ''
         ORDER BY case_ratio DESC NULLS LAST
         LIMIT %s
    """
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(sql, (limit,))
        rows = cur.fetchall()

    if only:
        only_lower = {c.strip().lower() for c in only}
        rows = [r for r in rows if str(r[0]).strip().lower() in only_lower]

    if not rows:
        return None

    # Colour by raw CASE COUNT relative to the peak among the shown countries.
    # (Density -- cases/km2 -- is still exposed as its own field for the hover
    # tooltip, but must NOT drive the colour here: a huge country like China
    # or Russia has a low cases-per-km2 density purely from its land area, so
    # colouring by density made it look LESS affected than a small, dense
    # country even when its actual case count dwarfs everyone else's -- the
    # opposite of what "compare cases between countries" should show.)
    case_counts = [float(annual_cases) for _country, _population, annual_cases in rows
                  if annual_cases is not None]
    peak_cases = max(case_counts, default=0) or 1

    points = []
    total_cases = 0.0
    for country, population, annual_cases in rows:
        key = str(country).strip().lower()
        centroid = _CASE_BURDEN_COUNTRY_CENTROIDS.get(key)
        if not centroid:
            continue  # no coordinates -> MapView would drop it anyway
        cases = float(annual_cases) if annual_cases is not None else 0.0
        total_cases += cases
        area = _CASE_BURDEN_COUNTRY_AREA_KM2.get(key)
        density = (cases / area) if (area and cases) else 0
        points.append({
            "lat": centroid[0], "lng": centroid[1],
            "name": country, "countryName": country,
            "iso3": _CASE_BURDEN_NAME_TO_ISO3.get(key),
            "population": int(population) if population is not None else None,
            "caseCount": round(cases, 2), "caseRatio": round(cases, 2),
            "area": area,
            "density": round(density, 6),
            "intensity": round(min(10.0, (cases / peak_cases) * 10), 2) if cases else 0,
        })

    if not points:
        return None

    legend = ("New cancer cases — " + ", ".join(p["name"] for p in points)
             if only else "New cancer cases per year")
    return {
        "data": points,
        "cohortTotal": round(total_cases),
        "variant": "population",
        "legendTitle": legend,
        "totalLabel": "cases per year",
    }


# Countries actually present in map_view_population (its own name set, not
# population.csv's -- avoids relying on _country_in_question's much broader
# population.csv-based list, which could match a country this table doesn't
# even have rows for).
def _case_burden_countries_in_question(question):
    """ALL map_view_population country names mentioned in the question,
    longest-first so e.g. 'united kingdom' matches before a shorter name
    would grab part of it first."""
    q = str(question or "")
    names = sorted(_CASE_BURDEN_COUNTRY_CENTROIDS.keys(), key=len, reverse=True)
    return [name for name in names if re.search(rf"\b{re.escape(name)}\b", q, re.IGNORECASE)]


def build_case_burden_map(question=""):
    """Real cancer case-burden props for MapView.

    - One country named -> zoom into that country's cities (Voronoi mode).
    - Several countries named ("Germany and China") -> world choropleth
      filtered to just those countries -- MapView's city-level mode can't
      show two countries' cities at once, so this is the closest honest
      answer rather than silently dropping every country but the first.
    - None named -> the full world view.
    """
    countries = _case_burden_countries_in_question(question)
    if len(countries) == 1:
        result = build_case_burden_country(countries[0])
        if result:
            return result
        # named country has no matching rows -> fall through to world view
    elif len(countries) > 1:
        result = build_case_burden_global(only=countries)
        if result:
            return result
    return build_case_burden_global()
