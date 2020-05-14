import path from "path";
import { compile, serialize, stringify } from "stylis";
import { readFile } from "./utils";

export async function readCss(
  { file, code, addWatchFile },
  imports = {},
  returnRules
) {
  let { dir } = path.parse(file);

  let rules = await Promise.all(
    compile(code).map(async (child) => {
      if (child.type.trim() == "@import") {
        let value = child.value
          .trim()
          .replace(/@import\s*(?:|\"|\')([^\"\']+)(?:|\"|\');/, "$1");
        let file = path.join(dir, value);
        if (!imports[file]) {
          imports[file] = true;
          try {
            let code = await readFile(file);
            addWatchFile(file);
            return readCss({ file, code, addWatchFile }, imports, true);
          } catch (e) {
            let file = path.join("node_modules", value);
            try {
              let code = await readFile(file);
              return readCss({ file, code }, imports, true);
            } catch (e) {}
          }
        }
        return [];
      }
      return child;
    })
  );

  rules = rules.flat();

  if (returnRules) {
    return rules;
  }
  return serialize(rules, stringify)
    .replace(/[\n\r\t]+/g, "")
    .replace(/[\s]+/g, " ")
    .replace(/\{\s+/g, "{");
}
