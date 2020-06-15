import sade from "sade";
import { createBundle } from "./create-bundle";
export { createBundle } from "./create-bundle";

sade("estack [src] [dest]")
  .version("PKG.VERSION")
  .option("--watch", "Watch files in bundle and rebuild on changes", false)
  .option("--external", "Does not include dependencies in the bundle")
  .option(
    "-c, --config",
    "Allows you to export a configuration from package.json"
  )
  .option("--sourcemap", "Enable the use of sourcemap", false)
  .option("--server", "Create a server, by default localhost:8000", false)
  .option("--port", "Define the server port", 8000)
  .option("--proxy", "Redirect requests that are not resolved locally", "")
  .option(
    "--runAfterBuild",
    "Allows to run a package script after each build cycle",
    ""
  )
  .option(
    "--sizes",
    "Displays the sizes of the files associated with rollup",
    false
  )
  .option("--jsx", "Pragma jsx", "h")
  .option("--jsxFragment", "Pragma fragment jsx", "Fragment")
  .option(
    "--minify",
    "Minify the code only if the flag --watch is not used",
    false
  )
  .example("src/index.html public --watch --server")
  .example("src/index.html public --external")
  .example("src/index.html public --external react,react-dom")
  .example("src/index.js dist --watch")
  .example("src/*.js dist")
  .example("src/*.html")
  .action((src, dest = "dest", options) => {
    createBundle({
      ...options,
      src,
      dest,
    }).catch((e) => console.log("" + e));
  })
  .parse(process.argv);
