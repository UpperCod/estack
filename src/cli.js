import sade from "sade";
import { createBundle } from "./create-bundle";
export { createBundle } from "./create-bundle";

sade("bundle [src] [dest]")
  .version("PKG.VERSION")
  .option("--watch", "Watch files in bundle and rebuild on changes", false)
  .option("--external", "Does not include dependencies in the bundle")
  .option(
    "-c, --config",
    "allows you to export a configuration from package.json"
  )
  .option("--sourcemap", "enable the use of sourcemap", true)
  .option("--server", "Create a server, by default localhost:8000", false)
  .option("--port", "define the server port", 8000)
  .option("--proxy", "redirect requests that are not resolved locally", "")
  .option(
    "--sizes",
    "Displays the sizes of the files associated with rollup",
    false
  )
  .option("--browsers", "define the target of the bundle", "> 3%")
  .option("--jsx", "pragma jsx", "h")
  .option("--jsxFragment", "pragma fragment jsx", "Fragment")
  .option(
    "--minify",
    "minify the code only if the flag --watch is not used",
    false
  )
  .example("src/index.html dist --watch --server")
  .example("src/index.html dist --external")
  .example("src/index.html dist --external react,react-dom")
  .example("src/index.js dist --watch")
  .example("src/*.js dist")
  .example("src/*.html")
  .example("")
  .action((src, dest = "dest", options) => {
    createBundle({
      ...options,
      src,
      dest,
    }).catch((e) => console.log("" + e));
  })
  .parse(process.argv);
