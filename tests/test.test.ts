import path from "path";
import { readFile } from "fs/promises";
import { build } from "../src/build";
import { expect } from "chai";

const src = "./tests/basic/index.html";
const org = "./tests/basic/src";
const dest = "./tests/basic/public";

const results = {
    "code-css.css": `body{color:red}`,
    "code-js.js": `console.log("js");`,
};

describe("Build", () => {
    it("check read and write", async function () {
        const { files } = await build({
            mode: "build",
            src,
            dest,
            port: 8000,
        });

        const filesSrc = ["code-css.css", "code-js.js"].map((fileName) =>
            path.join(org, fileName)
        );

        const filesExpect = [...filesSrc, src].map(path.normalize);
        // check read
        filesExpect.map((src) => {
            expect(files[src]).is.not.null;
        });
    });
});
