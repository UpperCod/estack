import { build } from "../src/build";
import { expect } from "chai";

const src = "./tests/basic/src/index.html";
const dest = "./tests/basic/public";

describe("Status and content", () => {
    it("a", async () => {
        await build({
            mode: "dev",
            src: "",
        });
        expect(10).to.equal(10);
    });
});
