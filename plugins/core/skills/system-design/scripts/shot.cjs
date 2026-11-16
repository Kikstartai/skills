#!/usr/bin/env node
const path = require("path");
const { chromium } = require(require.resolve("playwright", { paths: [process.cwd()] }));

(async () => {
  const [file, prefix] = process.argv.slice(2);
  if (!file || !prefix) {
    console.error("usage: node shot.cjs <page.html> <out-prefix>");
    process.exit(2);
  }
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1100, height: 900 } });
  await page.goto("file:///" + path.resolve(file).replace(/\\/g, "/"));
  await page.waitForTimeout(800);
  const figs = await page.$$("figure .diagram-box");
  for (let i = 0; i < figs.length; i++) {
    await figs[i].screenshot({ path: `${prefix}-${i}.png` });
    console.log(`${prefix}-${i}.png`);
  }
  await browser.close();
})();
