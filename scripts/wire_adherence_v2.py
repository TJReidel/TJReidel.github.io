from pathlib import Path

p = Path('index.html')
s = p.read_text(encoding='utf-8')


def replace_once(old, new, label):
    global s
    count = s.count(old)
    if count != 1:
        raise SystemExit(f'{label}: expected exactly 1 match, found {count}')
    s = s.replace(old, new, 1)

# 1) Load the adherence helper layers before the existing inline app script.
replace_once(
    '<div class="toast" id="toast"></div>\n<script>',
    '<div class="toast" id="toast"></div>\n<script src="adherence-v2.js"></script>\n<script src="adherence-v2-adapter.js"></script>\n<script>',
    'script includes'
)

# 2) Add calendar colors for persisted adherence history.
replace_once(
    '.day-cell.done{background:var(--teal)}\n.day-cell.partial{background:var(--teal-bg);border-color:var(--teal)}\n.day-cell.past{opacity:.6}',
    '.day-cell.done{background:var(--teal)}\n.day-cell.tier-yellow{background:var(--gold-bg);border-color:var(--gold)}\n.day-cell.tier-red{background:var(--red-bg);border-color:var(--red)}\n.day-cell.unrated{background:#fff;border-color:var(--ink3)}\n.day-cell.partial{background:var(--teal-bg);border-color:var(--teal)}\n.day-cell.past{opacity:.6}',
    'calendar css'
)
replace_once(
    '.day-cell.done .day-wd,.day-cell.done .day-num,.day-cell.done .day-ico{color:#fff}',
    '.day-cell.done .day-wd,.day-cell.done .day-num,.day-cell.done .day-ico{color:#fff}\n.day-cell.tier-yellow .day-ico{color:var(--gold);font-weight:900}\n.day-cell.tier-red .day-ico{color:var(--red);font-weight:900}\n.day-cell.unrated .day-ico{color:var(--ink2);font-weight:900}',
    'calendar icon css'
)

# 3) Make legacy booleans and new structured entries both count as taken.
replace_once(
    'function isDone(mid, date, time) { return !!S.taken[date + "_" + mid + "_" + time]; }',
    'function intakeKey(mid, date, time) { return date + "_" + mid + "_" + time; }\nfunction isDone(mid, date, time) {\n  var entry = S.taken[intakeKey(mid, date, time)];\n  return window.PillPlanAdherenceV2 ? PillPlanAdherenceV2.isTaken(entry) : !!entry;\n}\nfunction storedTier(mid, date, time) {\n  if (!window.PillPlanAdherenceV2) return null;\n  return PillPlanAdherenceV2.entryTier(S.taken[intakeKey(mid, date, time)]);\n}',
    'isDone helper'
)

# 4) Today view: taken doses use the persisted tier instead of turning automatically green.
replace_once(
    '    var done = isDone(m.id, td, ti);\n    var tier = done ? null : doseTier(ti);\n    var isLateYellow = tier === "yellow";\n    var isLateRed = tier === "red";\n    var statusLabel = done ? tr("done") : isLateRed ? tr("overdue") : isLateYellow ? tr("lateWarn") : tr("pending");\n    var cardTier = done ? "done" : isLateRed ? "overdue" : isLateYellow ? "tier-yellow" : "";\n    var statusTier = done ? "done" : isLateRed ? "overdue" : isLateYellow ? "yellow" : "pending";',
    '    var done = isDone(m.id, td, ti);\n    var tier = done ? storedTier(m.id, td, ti) : doseTier(ti);\n    var isLateYellow = tier === "yellow";\n    var isLateRed = tier === "red";\n    var isUnrated = tier === "unrated";\n    var statusLabel = done ? (isLateRed ? tr("done") + " · " + tr("overdue") : isLateYellow ? tr("done") + " · " + tr("lateWarn") : tr("done")) : isLateRed ? tr("overdue") : isLateYellow ? tr("lateWarn") : tr("pending");\n    var cardTier = done ? (isLateRed ? "done overdue" : isLateYellow ? "done tier-yellow" : "done") : isLateRed ? "overdue" : isLateYellow ? "tier-yellow" : "";\n    var statusTier = done ? (isLateRed ? "overdue" : isLateYellow ? "yellow" : "done") : isLateRed ? "overdue" : isLateYellow ? "yellow" : "pending";',
    'today tier rendering'
)

# 5) Calendar view: partial beats color; complete days show worst known tier.
old_plan = '''      var done2 = allDoneDay(m, d);\n      var anyDone = false;\n      for (var k = 0; k < m.times.length; k++) {\n        if (isDone(m.id, d, m.times[k])) { anyDone = true; break; }\n      }\n      var partial = !done2 && anyDone;\n      var isT = (d === td); var isPast = (d < td);\n      var cls = "day-cell";\n      if (done2) cls += " done";\n      else if (partial) cls += " partial";\n      else if (isPast) cls += " past";\n      if (isT) cls += " today";\n      html += '<button class="' + cls + '" data-toggle-day="' + m.id + '" data-date="' + d + '" aria-label="' + m.name + ' ' + d + (done2?' – '+tr("done"):'') + '">';\n      html += '<span class="day-wd" aria-hidden="true">' + fmtDayShort(d) + '</span>';\n      html += '<span class="day-num" aria-hidden="true">' + new Date(d + "T00:00:00").getDate() + '</span>';\n      html += '<span class="day-ico" aria-hidden="true">' + (done2?"✓":partial?"◑":"·") + '</span>';'''
new_plan = '''      var done2 = allDoneDay(m, d);\n      var anyDone = false;\n      var tiers = [];\n      for (var k = 0; k < m.times.length; k++) {\n        if (isDone(m.id, d, m.times[k])) {\n          anyDone = true;\n          tiers.push(storedTier(m.id, d, m.times[k]));\n        }\n      }\n      var partial = !done2 && anyDone;\n      var dayTier = null;\n      if (done2 && window.PillPlanAdherenceV2) {\n        if (tiers.indexOf("red") >= 0) dayTier = "red";\n        else if (tiers.indexOf("yellow") >= 0) dayTier = "yellow";\n        else if (tiers.indexOf("unrated") >= 0 || tiers.indexOf(null) >= 0) dayTier = "unrated";\n        else dayTier = "green";\n      }\n      var isT = (d === td); var isPast = (d < td);\n      var cls = "day-cell";\n      if (partial) cls += " partial";\n      else if (done2 && dayTier === "red") cls += " tier-red";\n      else if (done2 && dayTier === "yellow") cls += " tier-yellow";\n      else if (done2 && dayTier === "unrated") cls += " unrated";\n      else if (done2) cls += " done";\n      else if (isPast) cls += " past";\n      if (isT) cls += " today";\n      var dayIcon = partial ? "◑" : done2 && dayTier === "red" ? "!!" : done2 && dayTier === "yellow" ? "!" : done2 ? "✓" : "·";\n      html += '<button class="' + cls + '" data-toggle-day="' + m.id + '" data-date="' + d + '" aria-label="' + m.name + ' ' + d + (done2?' – '+tr("done"):'') + '">';\n      html += '<span class="day-wd" aria-hidden="true">' + fmtDayShort(d) + '</span>';\n      html += '<span class="day-num" aria-hidden="true">' + new Date(d + "T00:00:00").getDate() + '</span>';\n      html += '<span class="day-ico" aria-hidden="true">' + dayIcon + '</span>';'''
replace_once(old_plan, new_plan, 'calendar rendering')

# 6) Today click: no extra user step. Store actual local intake timestamp; undo removes it.
old_toggle = '''      var mid = tog.dataset.toggle; var time = tog.dataset.time; var date = tog.dataset.date;\n      var k = date + "_" + mid + "_" + time;\n      S.taken[k] = !S.taken[k];\n      persist();\n      // Update this card in-place without full re-render\n      var card = tog.closest(".dose-card");\n      if (card) {\n        var done = S.taken[k];\n        card.className = "dose-card anim-up " + (done ? "done" : "");\n        var icon = card.querySelector(".dose-icon");\n        if (icon) icon.textContent = done ? "✅" : "💊";\n        var status = card.querySelector(".dose-status");\n        if (status) {\n          status.textContent = done ? tr("done") : tr("pending");\n          status.className = "dose-status " + (done ? "done" : "pending");\n        }\n        tog.className = "check-btn " + (done ? "check-btn-on" : "check-btn-off");\n        tog.textContent = done ? "✓" : "○";\n        tog.setAttribute("aria-pressed", done);\n      }\n      // Update progress ring\n      var s = todayStats();\n      var r = 29; var circ = 2 * Math.PI * r;\n      var dash = circ - (circ * s.pct / 100);\n      var ring = document.querySelector(".ring-fill");\n      if (ring) ring.setAttribute("stroke-dashoffset", dash);\n      var pct = document.querySelector(".ring-pct");\n      if (pct) pct.textContent = s.pct + "%";\n      var sub = document.querySelector(".progress-sub");\n      if (sub) sub.textContent = s.dn + " / " + s.tot + " " + tr("doses") + " · " + s.pct + "%";\n      if (S.taken[k]) showToast(tr("taken"));\n      // Full re-render only if all done (to show celebration)\n      var allDone = true;\n      for (var i = 0; i < S.meds.length; i++) {\n        for (var j = 0; j < S.meds[i].times.length; j++) {\n          if (!isDone(S.meds[i].id, today(), S.meds[i].times[j])) { allDone = false; break; }\n        }\n      }\n      if (allDone) render();\n      return;'''
new_toggle = '''      var mid = tog.dataset.toggle; var time = tog.dataset.time; var date = tog.dataset.date;\n      var k = intakeKey(mid, date, time);\n      if (isDone(mid, date, time)) {\n        delete S.taken[k];\n      } else if (window.PillPlanAdherenceV2) {\n        S.taken[k] = PillPlanAdherenceV2.createTimedEntry(time, new Date());\n      } else {\n        S.taken[k] = true;\n      }\n      var nowDone = isDone(mid, date, time);\n      persist();\n      if (nowDone) showToast(tr("taken"));\n      render();\n      return;'''
replace_once(old_toggle, new_toggle, 'today toggle')

# 7) Calendar click: mark taken without inventing a timestamp or tier.
replace_once(
    '      var done3 = allDoneDay(m2, date2);\n      for (var j = 0; j < m2.times.length; j++) { S.taken[date2 + "_" + mid2 + "_" + m2.times[j]] = !done3; }\n      if (!done3) showToast(tr("taken"));\n      persist(); render(); return;',
    '      var done3 = allDoneDay(m2, date2);\n      for (var j = 0; j < m2.times.length; j++) {\n        var rk = intakeKey(mid2, date2, m2.times[j]);\n        if (done3) delete S.taken[rk];\n        else if (window.PillPlanAdherenceV2) S.taken[rk] = PillPlanAdherenceV2.createRetroactiveEntry();\n        else S.taken[rk] = true;\n      }\n      if (!done3) showToast(tr("taken"));\n      persist(); render(); return;',
    'calendar toggle'
)

p.write_text(s, encoding='utf-8')
print('index.html wired successfully')
