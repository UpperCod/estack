import MagicString from "magic-string";
/**
 * The chokidar package requires the use of fsevents, this module is problematic when grouping
 * chokidar, to avoid this rollup presents this solution, which allows you to condition its use only in the
 * if necessary, eliminating the mandatory  require.
 * {@link https://github.com/rollup/rollup/blob/master/build-plugins/conditional-fsevents-import.js}
 */
const FSEVENTS_REQUIRE = "require('fsevents')";
const REPLACEMENT =
  "require('../../../build-plugins/conditional-fsevents-import/fsevents-importer.js').getFsEvents()";

export default function conditionalFsEventsImport() {
  let transformed = false;
  return {
    name: "conditional-fs-events-import",
    transform(code, id) {
      if (id.endsWith("fsevents-handler.js")) {
        transformed = true;
        const requireStatementPos = code.indexOf(FSEVENTS_REQUIRE);
        if (requireStatementPos < 0) {
          throw new Error(
            `Could not find expected fsevents import "${FSEVENTS_REQUIRE}"`
          );
        }
        const magicString = new MagicString(code);
        magicString.overwrite(
          requireStatementPos,
          requireStatementPos + FSEVENTS_REQUIRE.length,
          REPLACEMENT
        );
        return {
          code: magicString.toString(),
          map: magicString.generateMap({ hires: true }),
        };
      }
    },
    buildEnd() {
      if (!transformed) {
        throw new Error(
          'Could not find "fsevents-handler.js", was the file renamed?'
        );
      }
    },
  };
}
