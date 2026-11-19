const { test, expect } = require("@playwright/test");
const fs = require("node:fs");
const path = require("node:path");

test("profile page closes scripts before closing the document body", () => {
  const html = fs.readFileSync(path.resolve(__dirname, "..", "profile.html"), "utf8");
  const lastScriptClose = html.lastIndexOf("</script>");
  const firstBodyClose = html.indexOf("</body>");

  expect(lastScriptClose).toBeGreaterThan(-1);
  expect(firstBodyClose).toBeGreaterThan(lastScriptClose);
});
