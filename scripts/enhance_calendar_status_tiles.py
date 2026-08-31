from pathlib import Path

p = Path("index.html")
s = p.read_text(encoding="utf-8")
old = '''.day-cell{aspect-ratio:1;min-height:44px;border-radius:12px;border:2px solid transparent;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;cursor:pointer;transition:all .18s;background:var(--cream2)}
.day-cell.today{border-color:var(--teal);border-width:3px}
.day-cell.done{background:var(--teal)}
.day-cell.tier-yellow{background:var(--gold-bg);border-color:var(--gold)}
.day-cell.tier-red{background:var(--red-bg);border-color:var(--red)}
.day-cell.unrated{background:#fff;border-color:var(--ink3)}
.day-cell.partial{background:var(--teal-bg);border-color:var(--teal)}
.day-cell.past{opacity:.6}
.day-wd{font-size:9px;font-weight:700;text-transform:uppercase;opacity:.8}
.day-num{font-size:14px;font-weight:800}
.day-ico{font-size:10px}
.day-cell.done .day-wd,.day-cell.done .day-num,.day-cell.done .day-ico{color:#fff}
.day-cell.tier-yellow .day-ico{color:var(--gold);font-weight:900}
.day-cell.tier-red .day-ico{color:var(--red);font-weight:900}
.day-cell.unrated .day-ico{color:var(--ink2);font-weight:900}
'''
new = '''.day-cell{aspect-ratio:1;min-height:44px;border-radius:12px;border:2px solid transparent;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;cursor:pointer;transition:all .18s;background:var(--cream2)}
.day-cell.today{border-color:var(--teal);border-width:3px}
.day-cell.done{background:var(--teal);border-color:var(--teal)}
.day-cell.tier-yellow{background:var(--gold);border-color:#8c6f42}
.day-cell.tier-red{background:var(--red);border-color:#8f2d23}
.day-cell.unrated{background:#d9d5cf;border-color:#77716b}
.day-cell.partial{background:var(--teal-bg);border-color:var(--teal);border-width:3px}
.day-cell.past{opacity:.9}
.day-wd{font-size:10px;font-weight:800;text-transform:uppercase;opacity:.95}
.day-num{font-size:15px;font-weight:900}
.day-ico{font-size:17px;font-weight:900;line-height:1}
.day-cell.done .day-wd,.day-cell.done .day-num,.day-cell.done .day-ico{color:#fff}
.day-cell.tier-yellow .day-wd,.day-cell.tier-yellow .day-num,.day-cell.tier-yellow .day-ico{color:var(--ink)}
.day-cell.tier-red .day-wd,.day-cell.tier-red .day-num,.day-cell.tier-red .day-ico{color:#fff}
.day-cell.unrated .day-wd,.day-cell.unrated .day-num,.day-cell.unrated .day-ico{color:var(--ink)}
.day-cell.partial .day-ico{color:var(--teal)}
'''
if s.count(old) != 1:
    raise SystemExit(f"expected one calendar style block, found {s.count(old)}")
s = s.replace(old, new, 1)
p.write_text(s, encoding="utf-8")
print("Calendar status tiles enhanced")
