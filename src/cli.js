import sade from "sade";
import createBundle from "./bundle";

sade("bundle [src] [dest]")
  .version("0.6.0")
  .option("-w, --watch", "Watch files in bundle and rebuild on changes", false)
  .option(
    "-e, --external",
    "Does not include dependencies in the bundle",
    false
  )
  .option("--server", "Create a server, by default localhost:8080", 0)
  .option("--browsers", "define the target of the bundle", "> 3%")
  .option(
    "--minify",
    "minify the code only if the flag --watch is not used",
    false
  )
  .example("src/index.html dist --watch --server 80")
  .example("src/index.html dist --watch --server")
  .example("src/index.js dist --watch")
  .example("src/*.js dist")
  .example("src/*.html")
  .example("")
  .action((src, dir = "dist", opts) => {
    createBundle({
      ...opts,
      dir,
      src: src ? src.split(/ *, */g) : []
    }).catch(e => {
      console.log(e);
    });
  })
  .parse(process.argv);
