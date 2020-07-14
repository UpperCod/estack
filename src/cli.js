import sade from "sade";
import { createBuild } from "./create-build";

sade("estack <mode> <src> [dest]")
    .version("PKG.VERSION")
    .option("--watch", "Detect file changes to generate a new build", false)
    .option("--external", "Does not include dependencies in build")
    .option("--server", "Create a server, by default localhost:8000")
    .option("--port", "Define the server port", 8000)
    .option("--proxy", "Redirect requests that are not resolved locally", "")
    .option("--href", "add a prefix to the resolved links", "/")
    .option("--assetsDir", "define a destination directory for assets")
    .option(
        "--hashAllAssets",
        "all assets will be hacked including js and css",
        false
    )
    .option(
        "--assetHashPattern",
        "customize the destination name for the assets",
        "[hash]-[name]"
    )
    .option("--sourcemap", "Enable the use of sourcemap", false)
    .option("--silent", "Prevents printing of logs", false)
    .option("--forceWrite", "Force writing files in development mode", false)
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
    .example("dev src/index.html")
    .example("dev src/**/*.{html,md}")
    .example("dev src/app.js")
    .example("build src/index.html public")
    .example("build src/*.js dist")
    .example("build src/*.js dist --external")
    .example("build src/*.js dist --external package_1,package_2,package_3")
    .action((mode, src, dest, options) => {
        createBuild({
            ...options,
            mode,
            src,
            dest,
        }).catch((e) => console.log("" + e));
    })
    .parse(process.argv);
