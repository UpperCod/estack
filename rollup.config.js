import replace from "@rollup/plugin-replace";
import common from "@rollup/plugin-commonjs";
import resolve from "@rollup/plugin-node-resolve";
import json from "@rollup/plugin-json";
import builtins from "builtin-modules";
import pkg from "./package.json";
import conditionalFsEventsImport from "./build-plugins/conditional-fsevents-import/conditional-fsevents-import";

export default {
    input: "src/cli.js",
    output: {
        file: "cli.js",
        format: "cjs",
        banner: "#!/usr/bin/env node",
        externalLiveBindings: false,
        freeze: false,
        interop: false,
    },
    external: [...builtins, ...Object.keys(pkg.dependencies)],
    //treeshake: {
    //  moduleSideEffects: false,
    //  propertyReadSideEffects: false,
    //  tryCatchDeoptimization: false,
    //},
    plugins: [
        replace({
            "PKG.VERSION": pkg.version,
        }),
        ...(process.env.ROLLUP_WATCH
            ? []
            : [
                  resolve({}),
                  json(),
                  conditionalFsEventsImport(),
                  common(),
                  // pluginTerser({ sourcemap: true }),
              ]),
    ],
};
