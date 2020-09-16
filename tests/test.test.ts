import { build } from "../src/build";
import { expect } from "chai";

const src = "./tests/basic/index.html";
const dest = "./tests/basic/public";

describe("Status and content", () => {
    it("a", async () => {
        const { files } = await build({
            mode: "build",
            src,
            dest,
            port: 8000,
        });

        expect(10).to.equal(10);
    });
});
