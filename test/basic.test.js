const test = require("ava");
const { createBuild } = require("../cli");
const fs = require("fs").promises;
const path = require("path");
const utils = require("./utils");

let src = "./test/basic/index.html";
let dest = "./test/basic/dest";

test.before(async () => {
  await createBuild({
    src,
    dest,
    silent: true,
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
