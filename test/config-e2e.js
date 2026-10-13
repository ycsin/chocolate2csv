// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 Yong Cong Sin <yongcong.sin@gmail.com>
// Drive the Accounts configurator: rename, exclude, reload, reset.
//   CHROME=<path> node config-e2e.js <pdf dir> <out dir>
const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright-core");
const P = require("../src/parser.js");

(async () => {
  const [pdfDir, outDir] = process.argv.slice(2);
  const browser = await chromium.launch({ executablePath: process.env.CHROME });
  const page = await (await browser.newContext({ viewport: { width: 1100, height: 900 } })).newPage();
  const problems = [];
  page.on("pageerror", (e) => problems.push(String(e)));
  await page.goto("file://" + path.resolve(__dirname, "../index.html"));
  const files = fs.readdirSync(pdfDir).filter((f) => /\.pdf$/i.test(f)).map((f) => path.join(pdfDir, f));
  const load = async () => {
    await page.setInputFiles("#picker", files);
    await page.waitForSelector("#cards .card", { timeout: 180000 });
    await page.waitForFunction(() => document.querySelector("#busy").hidden, null, { timeout: 180000 });
  };
  await load();
  const cards = () => page.$$eval("#cards .card h3", (h) => h.map((x) => x.textContent));
  const balanceOf = (name) => page.$$eval("#cards .card", (cs, n) => {
    const c = cs.find((x) => x.querySelector("h3").textContent === n);
    return c ? [...c.querySelectorAll("dd")].pop().textContent : null;
  }, name);
  const portfolios = await page.$$eval("#config-list .account-row", (rows) => rows.map((r) => [r.dataset.id, r.querySelector("strong").textContent]));
  console.log("detected:", portfolios.map(([, l]) => l).join(", "));
  const idOf = (label) => portfolios.find(([, l]) => l === label)[0];

  // Rename the first account, exclude the last one.
  const renamed = portfolios[0][1], excluded = portfolios[portfolios.length - 1][1];
  console.log(`rename "${renamed}" to "Renamed", exclude "${excluded}"`);
  await page.click(".config > summary");
  await page.fill(`.account-row[data-id="${idOf(renamed)}"] input[data-field="name"]`, "Renamed");
  await page.press(`.account-row[data-id="${idOf(renamed)}"] input[data-field="name"]`, "Enter");
  await page.uncheck(`.account-row[data-id="${idOf(excluded)}"] input[data-field="include"]`);
  const after = await cards();
  console.log("cards after rename/exclude:", after.join(", "));
  console.log("count text:", await page.textContent("#config-count"));
  const cfg = await page.evaluate(() => JSON.parse(localStorage.getItem("chocolate-csv-accounts")));
  const r = P.parseStatements(JSON.parse(fs.readFileSync(process.env.DUMP, "utf8")), cfg);
  console.log("renamed:", !!r.accounts["Renamed"], " excluded gone:", !r.accounts[excluded]);

  await page.reload();
  await load();
  console.log("after reload:", (await cards()).join(", ") === after.join(", ") ? "settings kept" : "SETTINGS LOST");
  await page.click(".config > summary");
  await page.click("#config-reset");
  console.log("after reset:", (await cards()).join(", "));
  console.log("errors:", problems.length ? problems : "none");
  await browser.close();
})();
