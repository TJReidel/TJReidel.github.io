from pathlib import Path

p = Path("index.html")
s = p.read_text(encoding="utf-8")
old_start = '  root.addEventListener("click", function(e) {'
new_start = '  root.onclick = function(e) {'
old_end = '    if (scp && scp.contains(e.target)) { shareVia("copy"); return; }\n  });\n\n  var inputs ='
new_end = '    if (scp && scp.contains(e.target)) { shareVia("copy"); return; }\n  };\n\n  var inputs ='
if s.count(old_start) != 1:
    raise SystemExit(f"expected exactly one root click handler start, found {s.count(old_start)}")
if s.count(old_end) != 1:
    raise SystemExit(f"expected exactly one root click handler end, found {s.count(old_end)}")
s = s.replace(old_start, new_start, 1).replace(old_end, new_end, 1)
p.write_text(s, encoding="utf-8")
print("Undo handler fix applied")
