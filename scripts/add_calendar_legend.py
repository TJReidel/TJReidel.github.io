from pathlib import Path

p = Path("index.html")
s = p.read_text(encoding="utf-8")

css_anchor = '.plan-divider{height:1px;background:var(--cream2);margin:20px 0}\n'
css_insert = '''.status-legend{background:#fff;border:2px solid var(--cream2);border-radius:16px;margin:0 0 18px;padding:0;overflow:hidden}\n.status-legend summary{list-style:none;cursor:pointer;padding:14px 16px;font-size:15px;font-weight:800;color:var(--ink);display:flex;align-items:center;justify-content:space-between;min-height:48px}\n.status-legend summary::-webkit-details-marker{display:none}\n.status-legend summary::after{content:\"⌄\";font-size:18px;color:var(--ink2)}\n.status-legend[open] summary::after{content:\"⌃\"}\n.status-legend-body{border-top:1px solid var(--cream2);padding:12px 16px 14px;display:grid;gap:9px}\n.status-legend-row{display:flex;align-items:center;gap:10px;font-size:14px;line-height:1.35;color:var(--ink2)}\n.status-swatch{width:22px;height:22px;border-radius:7px;border:2px solid transparent;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:900}\n.status-swatch.green{background:var(--teal);border-color:var(--teal);color:#fff}\n.status-swatch.yellow{background:var(--gold);border-color:#8c6f42;color:var(--ink)}\n.status-swatch.red{background:var(--red);border-color:#8f2d23;color:#fff}\n.status-swatch.neutral{background:#d9d5cf;border-color:#77716b;color:var(--ink)}\n.status-swatch.open{background:#fff;border-color:var(--cream2);color:var(--ink2)}\n''' + css_anchor
if s.count(css_anchor) != 1:
    raise SystemExit(f"expected one CSS anchor, found {s.count(css_anchor)}")
s = s.replace(css_anchor, css_insert, 1)

plan_anchor = "  var html = '';\n  for (var mi = 0; mi < S.meds.length; mi++) {"
plan_insert = """  var html = '';
  html += buildStatusLegend();
  for (var mi = 0; mi < S.meds.length; mi++) {"""
if s.count(plan_anchor) != 1:
    raise SystemExit(f"expected one buildPlan anchor, found {s.count(plan_anchor)}")
s = s.replace(plan_anchor, plan_insert, 1)

settings_anchor = "  html += '<div class=\"settings-section anim-up\" style=\"animation-delay:120ms\"><div class=\"settings-title\">' + tr(\"notifAllow\") + '</div>';"
settings_insert = """  html += '<div class="settings-section anim-up" style="animation-delay:120ms"><div class="settings-title">' + (S.lang==="de"?"Wichtige Info":"Important information") + '</div>';
  html += buildStatusLegend();
  html += '</div>';
  html += '<div class="settings-section anim-up" style="animation-delay:160ms"><div class="settings-title">' + tr("notifAllow") + '</div>';"""
if s.count(settings_anchor) != 1:
    raise SystemExit(f"expected one settings anchor, found {s.count(settings_anchor)}")
s = s.replace(settings_anchor, settings_insert, 1)

func_anchor = "function buildPlan(days14, td) {"
legend_func = r'''function buildStatusLegend() {
  var de = S.lang === "de";
  var title = de ? "Was bedeuten die Farben?" : "What do the colors mean?";
  var rows = de ? [
    ["green","✓","Grün – Einnahme dokumentiert und pünktlich"],
    ["yellow","!","Gelb – dokumentiert, 30–44 Min. verspätet"],
    ["red","!","Rot – dokumentiert, 45 Min. oder mehr verspätet"],
    ["neutral","✓","Hellgrau – nachgetragen, genaue Zeit unbekannt"],
    ["open","○","Weiß – noch nicht dokumentiert"]
  ] : [
    ["green","✓","Green – documented and on time"],
    ["yellow","!","Yellow – documented, 30–44 min late"],
    ["red","!","Red – documented, 45 min or more late"],
    ["neutral","✓","Light grey – added later, exact time unknown"],
    ["open","○","White – not yet documented"]
  ];
  var html = '<details class="status-legend"><summary>' + title + '</summary><div class="status-legend-body">';
  for (var i=0;i<rows.length;i++) {
    html += '<div class="status-legend-row"><span class="status-swatch ' + rows[i][0] + '" aria-hidden="true">' + rows[i][1] + '</span><span>' + rows[i][2] + '</span></div>';
  }
  html += '</div></details>';
  return html;
}

''' + func_anchor
if s.count(func_anchor) != 1:
    raise SystemExit(f"expected one buildPlan function anchor, found {s.count(func_anchor)}")
s = s.replace(func_anchor, legend_func, 1)

p.write_text(s, encoding="utf-8")
print("Calendar legend added to Plan and Settings")
