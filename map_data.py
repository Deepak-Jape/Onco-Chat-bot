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


def _clean_country(name):
    """'United States ( USA )' -> 'United States'."""
    return re.sub(r"\s*\([^)]*\)\s*$", "", str(name or "")).strip()


def _population_by_country():
    out = {}
    try:
        with io.open(_POP_CSV, encoding="utf-8", errors="replace") as fh:
            for row in csv.DictReader(fh):
                country = _clean_country(row.get("country"))
                try:
                    out[country.lower()] = int(row.get("population_in_number") or 0)
                except (TypeError, ValueError):
                    continue
    except OSError:
        pass
    return out


def build_map_points(oncosuite_ids=None, limit=3000):
    """Points for MapView, or None when nothing is mappable.

    With `oncosuite_ids` the map is scoped to those trials' sites; without it,
    every geocoded site is used.
    """
    where, params = ["f.latitude IS NOT NULL", "f.longitude IS NOT NULL"], []
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

    pops = _population_by_country()
    # Density is each point's trial count scaled against the busiest point, so
    # the 0-1 range the component expects reflects real relative concentration.
    peak = max((int(r[5] or 0) for r in rows), default=0) or 1

    points, trial_ids = [], set()
    for lat, lon, city, country, sites, trials in rows:
        label = _clean_country(country)
        name = f"{city}, {label}" if city else label
        points.append({
            "lat": float(lat),
            "lng": float(lon),
            "name": name,
            "population": pops.get(label.lower()) or int(sites or 0),
            "density": round(min(1.0, (int(trials or 0) / peak)), 4),
            "sites": int(sites or 0),
            "trials": int(trials or 0),
        })
        trial_ids.add(trials)

    total_sites = sum(p["sites"] for p in points)
    return {
        "data": points,
        "cohortTotal": total_sites,
        "variant": "population",
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

    pops = _population_by_country()
    out = []
    for country, sites, trials in rows:
        label = _clean_country(country)
        pop = pops.get(label.lower())
        out.append({
            "country": label,
            "trials": int(trials or 0),
            "sites": int(sites or 0),
            # Left as None when population.csv has no row for the country --
            # the table shows a dash rather than a guessed figure.
            "population": pop,
        })
    return out
