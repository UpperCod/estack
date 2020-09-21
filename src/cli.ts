import sade from "sade";
import { build } from "./build";

sade("estack <mode> <src> [dest]")
    .version("PKG.VERSION")
    .option("--port", "Define the server port", 8000)
    .option("--href", "add a prefix to the resolved links", "/")
    .option("--sourcemap", "Enable the use of sourcemap", false)
    .option("--external", "define external dependencies", "")
    .option("--watch", "Prevents printing of logs", false)
    .option(
        "--js",
        "define an index to use the package for importing plugins",
        ""
    )
    .option(
        "--css",
        "define an index to use the package for importing plugins",
        ""
    )
    .option(
        "--minify",
        "Minify the code only if the flag --watch is not used",
        false
    )
    .example("dev src/index.html")
    .action((mode, src, dest, options) => {
        build({
            ...options,
            mode,
            src,
            dest,
        });
    })
    .parse(process.argv);
