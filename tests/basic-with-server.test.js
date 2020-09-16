import test from "ava";
import { build } from "../src/build";
import puppeteer from "puppeteer";
import utils from "./utils";

let src = "./test/basic/index.html";
let dest = "./test/basic/public";
let port = 8000;

test.before(async () => {
    await build({
        mode: "dev",
        src,
        dest,
        server: true,
        port,
    });
});

test("basic: transformation and writing of export files", async (t) => {
    let cases = require("./basic/cases");
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(`http://localhost:${port}`);

    let els = await page.evaluate(
        `Array.from(document.querySelectorAll("[href],[src]")).map(el=>el.outerHTML).join("")`
    );

    let { data } = cases.find(({ file }) => file == "index.html");

    t.is(utils.normalizeData(els), utils.normalizeData(data));
});
