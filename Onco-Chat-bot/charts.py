"""
Lightweight, dependency-free SVG chart helpers for web_app.py.
No matplotlib/plotly -- these are plain strings, rendered natively by the
browser, consistent with the rest of this stdlib-only HTTP server.
"""
import html

BAR_COLOR = "#2563eb"
BAR_COLOR_ALT = "#059669"
AXIS_COLOR = "#6b7280"
TEXT_COLOR = "#1f2937"

# A categorical palette -- distinct, readable hues on the dark background. Each
# bar/slice cycles through these so different categories are easy to tell apart
# instead of one flat blue. Ordered so adjacent colors contrast well.
PALETTE = [
    "#4c8bf5",  # blue
    "#38b48b",  # green
    "#e2795a",  # coral
    "#c98bd6",  # violet
    "#f2c14e",  # amber
    "#5ec8e5",  # cyan
    "#f27a9d",  # pink
    "#8bd450",  # lime
    "#b98cff",  # purple
    "#ff9f68",  # orange
]


def _esc(s):
    return html.escape(str(s), quote=True)


def _color_for(i):
    return PALETTE[i % len(PALETTE)]


def bar_chart(data, title="", value_suffix="", width=680, bar_height=28, color=None,
              multicolor=True):
    """
    data: list of (label, value) tuples, already sorted the way you want displayed.
    Renders a horizontal bar chart -- reads better than vertical for long labels
    (drug names, country names, AE names) which is most of what this app shows.

    By default each bar takes a distinct color from PALETTE so categories are easy
    to distinguish. Pass color="#xxxxxx" (and it forces a single color) or
    multicolor=False to fall back to one uniform hue.
    """
    if not data:
        return ""
    single = color if color else (None if multicolor else BAR_COLOR)
    max_val = max((v for _, v in data if v is not None), default=0) or 1
    label_col_w = min(220, max(90, max(len(str(l)) for l, _ in data) * 7))
    chart_area_w = width - label_col_w - 70  # leave room for the value label on the right
    row_gap = 8
    top_pad = 30 if title else 6
    height = top_pad + len(data) * (bar_height + row_gap) + 10

    rows = []
    y = top_pad
    for i, (label, value) in enumerate(data):
        value = value or 0
        bar_w = max(2, (value / max_val) * chart_area_w)
        bar_color = single or _color_for(i)
        rows.append(f'''
        <text x="{label_col_w - 8}" y="{y + bar_height / 2}" text-anchor="end"
              dominant-baseline="central" font-size="12.5" fill="{TEXT_COLOR}">{_esc(label)[:30]}</text>
        <rect x="{label_col_w}" y="{y}" width="{bar_w:.1f}" height="{bar_height}" rx="4" fill="{bar_color}" opacity="0.9"/>
        <text x="{label_col_w + bar_w + 8}" y="{y + bar_height / 2}" dominant-baseline="central"
              font-size="12.5" fill="{TEXT_COLOR}">{_esc(value)}{_esc(value_suffix)}</text>
        ''')
        y += bar_height + row_gap

    title_svg = (f'<text x="0" y="16" font-size="13" font-weight="600" fill="{TEXT_COLOR}">{_esc(title)}</text>'
                 if title else "")

    return f'''
    <div class="chart-wrap">
      <svg viewBox="0 0 {width} {height}" width="100%" height="{height}" role="img" aria-label="{_esc(title)}">
        {title_svg}
        {"".join(rows)}
      </svg>
    </div>
    '''


def grouped_bar_chart(groups, series_names, title="", width=680, bar_height=18, colors=None):
    """
    groups: list of (group_label, [value_series1, value_series2, ...])
    series_names: labels for each value in the tuple, used in a small legend.
    Used for e.g. adverse events: all_grades vs grade_3_4 side by side per event.
    """
    if not groups:
        return ""
    colors = colors or [BAR_COLOR, "#e2795a", BAR_COLOR_ALT, "#c98bd6"]
    n_series = len(series_names)
    max_val = max((v for _, vals in groups for v in vals if v is not None), default=0) or 1
    label_col_w = min(220, max(110, max(len(str(g)) for g, _ in groups) * 7))
    chart_area_w = width - label_col_w - 70
    sub_bar_h = max(8, bar_height // n_series - 2)
    group_h = bar_height + 6
    top_pad = 46 if title else 20

    legend_items = []
    lx = label_col_w
    for i, name in enumerate(series_names):
        legend_items.append(f'<rect x="{lx}" y="4" width="10" height="10" rx="2" fill="{colors[i % len(colors)]}"/>'
                             f'<text x="{lx + 14}" y="13" font-size="11" fill="{TEXT_COLOR}">{_esc(name)}</text>')
        lx += 16 + len(name) * 6 + 14
    legend_svg = "".join(legend_items)

    height = top_pad + len(groups) * group_h + 10
    rows = []
    y = top_pad
    for label, values in groups:
        rows.append(f'<text x="{label_col_w - 8}" y="{y + group_h / 2}" text-anchor="end" '
                     f'dominant-baseline="central" font-size="12" fill="{TEXT_COLOR}">{_esc(label)[:28]}</text>')
        sy = y
        for i, v in enumerate(values):
            v = v or 0
            bar_w = max(2, (v / max_val) * chart_area_w)
            rows.append(f'<rect x="{label_col_w}" y="{sy}" width="{bar_w:.1f}" height="{sub_bar_h}" '
                         f'rx="3" fill="{colors[i % len(colors)]}" opacity="0.9"/>'
                         f'<text x="{label_col_w + bar_w + 6}" y="{sy + sub_bar_h / 2}" dominant-baseline="central" '
                         f'font-size="10.5" fill="{TEXT_COLOR}">{_esc(v)}</text>')
            sy += sub_bar_h + 2
        y += group_h

    title_svg = (f'<text x="0" y="16" font-size="13" font-weight="600" fill="{TEXT_COLOR}">{_esc(title)}</text>'
                 if title else "")

    return f'''
    <div class="chart-wrap">
      <svg viewBox="0 0 {width} {height}" width="100%" height="{height}" role="img" aria-label="{_esc(title)}">
        {title_svg}
        {legend_svg}
        {"".join(rows)}
      </svg>
    </div>
    '''


def donut_chart(data, title="", width=680, value_suffix=""):
    """
    data: list of (label, value) tuples. Renders a donut (ring) chart with a legend.
    Use for "share of a whole" data -- e.g. trials by phase, sites by country as a
    proportion of all sites -- where the parts summing to 100% is the point. For pure
    magnitude comparison prefer bar_chart. Values must be non-negative.
    """
    data = [(l, v or 0) for l, v in data if (v or 0) > 0]
    if not data:
        return ""
    total = sum(v for _, v in data) or 1
    cx, cy, r, thick = 90, 100, 74, 30  # donut on the left, legend on the right
    import math
    segs = []
    angle = -90.0  # start at 12 o'clock
    for i, (label, value) in enumerate(data):
        frac = value / total
        sweep = frac * 360.0
        a0 = math.radians(angle)
        a1 = math.radians(angle + sweep)
        x0, y0 = cx + r * math.cos(a0), cy + r * math.sin(a0)
        x1, y1 = cx + r * math.cos(a1), cy + r * math.sin(a1)
        large = 1 if sweep > 180 else 0
        # ring segment as a thick arc (stroke on a path following the outer radius)
        segs.append(
            f'<path d="M {x0:.2f} {y0:.2f} A {r} {r} 0 {large} 1 {x1:.2f} {y1:.2f}" '
            f'fill="none" stroke="{_color_for(i)}" stroke-width="{thick}" opacity="0.92"/>'
        )
        angle += sweep

    # legend on the right, one row per category with its color, label, value & %
    legend_x = cx + r + 40
    legend = []
    ly = 24
    for i, (label, value) in enumerate(data):
        pct = 100.0 * value / total
        legend.append(
            f'<rect x="{legend_x}" y="{ly}" width="12" height="12" rx="3" fill="{_color_for(i)}"/>'
            f'<text x="{legend_x + 20}" y="{ly + 10}" font-size="12.5" fill="{TEXT_COLOR}">'
            f'{_esc(label)[:34]} &#8212; {_esc(value)}{_esc(value_suffix)} ({pct:.0f}%)</text>'
        )
        ly += 22

    height = max(cy + r + 20, ly + 10)
    center_lbl = (f'<text x="{cx}" y="{cy - 4}" text-anchor="middle" font-size="20" font-weight="700" '
                  f'fill="{TEXT_COLOR}">{_esc(total)}</text>'
                  f'<text x="{cx}" y="{cy + 14}" text-anchor="middle" font-size="10.5" '
                  f'fill="{AXIS_COLOR}">total</text>')
    title_svg = (f'<text x="0" y="14" font-size="13" font-weight="600" fill="{TEXT_COLOR}">{_esc(title)}</text>'
                 if title else "")
    top_shift = 22 if title else 0

    return f'''
    <div class="chart-wrap">
      <svg viewBox="0 0 {width} {height + top_shift}" width="100%" height="{height + top_shift}"
           role="img" aria-label="{_esc(title)}">
        {title_svg}
        <g transform="translate(0,{top_shift})">
          {"".join(segs)}
          {center_lbl}
          {"".join(legend)}
        </g>
      </svg>
    </div>
    '''


def simple_table(headers, rows, title="", allow_html_cols=None):
    """Real HTML table -- used where a chart wouldn't add value over the actual numbers.

    allow_html_cols: optional set of column indexes whose cell values are ALREADY safe
    HTML (e.g. pre-rendered clickable chips) and must NOT be re-escaped. Every other
    column is still escaped. Callers passing HTML must escape any user data themselves."""
    allow_html_cols = allow_html_cols or set()
    title_html = f'<h4 class="chart-title">{_esc(title)}</h4>' if title else ""
    head = "".join(f"<th>{_esc(h)}</th>" for h in headers)
    body = "".join(
        "<tr>" + "".join(
            f"<td>{c if ci in allow_html_cols else _esc(c)}</td>"
            for ci, c in enumerate(row)
        ) + "</tr>"
        for row in rows
    )
    # Wrap the table in a horizontally scrollable container so wide result sets
    # (many columns / long cells) scroll instead of being clipped by the card.
    return f'''
    <div class="chart-wrap">
      {title_html}
      <div class="table-wrap"><table class="data-table"><thead><tr>{head}</tr></thead><tbody>{body}</tbody></table></div>
    </div>
    '''


CHART_CSS = """
.chart-wrap { margin: 14px 0; }
.chart-title { font-size: 13px; font-weight: 600; color: #e6eaf2; margin: 0 0 8px; }
.data-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.data-table th { text-align: left; color: #8b95a7; font-weight: 600; font-size: 11px;
                 text-transform: uppercase; letter-spacing: .04em; padding: 6px 10px;
                 border-bottom: 1px solid #232c3d; }
.data-table td { padding: 7px 10px; border-bottom: 1px solid #1a2131; color: #e6eaf2; }
.data-table tr:hover td { background: #161c2b; }
"""