from pathlib import Path

p = Path("index.html")
s = p.read_text(encoding="utf-8")
repls = {
'.day-cell.tier-yellow{background:var(--gold);border-color:#8c6f42}':'.day-cell.tier-yellow{background:#d7b46a;border-color:#9a7838}',
'.day-cell.tier-red{background:var(--red);border-color:#8f2d23}':'.day-cell.tier-red{background:#c94a3b;border-color:#9f3026}',
'.day-cell.unrated{background:#d9d5cf;border-color:#77716b}':'.day-cell.unrated{background:#ece9e4;border-color:#8a847d}',
'.day-cell.past{opacity:.9}':'.day-cell.past{opacity:.96}',
'.day-ico{font-size:17px;font-weight:900;line-height:1}':'.day-ico{font-size:18px;font-weight:900;line-height:1}',
'.day-cell.unrated .day-wd,.day-cell.unrated .day-num,.day-cell.unrated .day-ico{color:var(--ink)}':'.day-cell.unrated .day-wd,.day-cell.unrated .day-num{color:#4f4a45}.day-cell.unrated .day-ico{color:#2f2c29}',
'.status-swatch.yellow{background:var(--gold);border-color:#8c6f42;color:var(--ink)}':'.status-swatch.yellow{background:#d7b46a;border-color:#9a7838;color:var(--ink)}',
'.status-swatch.red{background:var(--red);border-color:#8f2d23;color:#fff}':'.status-swatch.red{background:#c94a3b;border-color:#9f3026;color:#fff}',
'.status-swatch.neutral{background:#d9d5cf;border-color:#77716b;color:var(--ink)}':'.status-swatch.neutral{background:#ece9e4;border-color:#8a847d;color:#2f2c29}'
}
for old,new in repls.items():
    if s.count(old) != 1:
        raise SystemExit(f"expected exactly one occurrence: {old!r}; found {s.count(old)}")
    s = s.replace(old,new,1)
p.write_text(s,encoding="utf-8")
print("Calendar status visual polish applied")
