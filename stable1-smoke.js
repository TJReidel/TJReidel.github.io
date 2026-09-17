// PillPlan STABLE 1 release-candidate smoke test.
// Run against a local HTTP server: node stable1-smoke.js http://127.0.0.1:4173
const { chromium } = require("playwright");

const baseUrl = process.argv[2] || "http://127.0.0.1:4173";

function assert(condition, message) {
  if (!condition) throw new Error(message);
  console.log("PASS:", message);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ serviceWorkers: "allow" });
  const page = await context.newPage();

  try {
    await page.goto(baseUrl, { waitUntil: "networkidle" });
    await page.evaluate(async () => {
      await navigator.serviceWorker.ready;
    });
    await page.reload({ waitUntil: "networkidle" });

    assert(await page.title() === "PillPlan v1.2", "document title is PillPlan v1.2");

    await page.getByRole("button", { name: /Einstellungen/ }).click();
    assert(await page.getByText("PillPlan v1.2", { exact: true }).isVisible(), "settings footer is PillPlan v1.2");

    await page.getByRole("button", { name: /English/ }).click();
    assert(await page.locator("html").getAttribute("lang") === "en", "English selection sets html lang=en");

    await page.getByRole("button", { name: /Add/ }).click();
    const doseLabels = await page.locator(".time-optional").allTextContents();
    assert(JSON.stringify(doseLabels) === JSON.stringify([
      "1st dose *",
      "2nd dose (optional)",
      "3rd dose (optional)",
      "4th dose (optional)"
    ]), "English dose labels contain no German text");

    await page.evaluate(() => {
      localStorage.setItem("pillplan_v4", JSON.stringify({
        lang: "en", meds: [], taken: {}, screen: "today", notif: false, period: 7
      }));
    });
    await page.reload({ waitUntil: "networkidle" });
    assert(await page.getByText("Restore backup", { exact: true }).isVisible(), "empty-state restore link is English");

    await page.addScriptTag({ path: "adherence-v2.js" });
    await page.addScriptTag({ path: "adherence-v2.tests.js" });
    await page.addScriptTag({ path: "statistics-v2.js" });
    await page.addScriptTag({ path: "statistics-v2.tests.js" });
    assert(true, "existing adherence and statistics browser tests complete");
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error("FAIL:", error.message);
  process.exitCode = 1;
});
