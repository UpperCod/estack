import sade from "sade";
import createBundle from "./bundle";

sade("bundle [src] [dest]")
  .version("PKG.VERSION")
  .option("-w, --watch", "Watch files in bundle and rebuild on changes", false)
  .option("-e, --external", "Does not include dependencies in the bundle")
  .option(
    "-c, --config",
    "allows you to export a configuration from package.json"
  )
  .option("--sourcemap", "enable the use of sourcemap", true)
  .option("--server", "Create a server, by default localhost:8000", false)
  .option("--port", "define the server port", 8000)
  .option("--browsers", "define the target of the bundle", "> 3%")
  .option("--template", "define the top template file for html or md")
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
      dest
    }).catch(e => console.log("" + e));
  })
  .parse(process.argv);
