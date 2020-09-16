import test from "ava";
import { promises as fs } from "fs";
import path from "path";
import { createBuild } from "../src/create-build";
import utils from "./utils";

let src = "./test/basic/index.html";
let dest = "./test/basic/dest";

test.before(async () => {
    await createBuild({
        src,
        dest,
        silent: true,
        assetsDir: "",
        hashAllAssets: false,
    });
});

test("basic: transformation and writing of export files", async (t) => {
    let cases = require("./basic/cases");
    await Promise.all(
        cases.map(async ({ file, data }) => {
            let realData = await fs.readFile(
                path.join(__dirname, "../", dest, file),
                "utf8"
            );
            t.is(utils.normalizeData(realData), utils.normalizeData(data));
        })
    );
});
