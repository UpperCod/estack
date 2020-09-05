import replace from "@rollup/plugin-replace";
import common from "@rollup/plugin-commonjs";
import resolve from "@rollup/plugin-node-resolve";
import json from "@rollup/plugin-json";
import builtins from "builtin-modules";
import pkg from "./package.json";
import conditionalFsEventsImport from "./build-plugins/conditional-fsevents-import/conditional-fsevents-import";
import typescript from "@rollup/plugin-typescript";

export default {
    input: "src2/build.ts",
    output: {
        file: "build.js",
        format: "cjs",
        banner: "#!/usr/bin/env node",
        externalLiveBindings: false,
        freeze: false,
        interop: false,
    },
    external: [
        "@estack/core",
        ...builtins,
        ...Object.keys(pkg.dependencies),
        ...Object.keys(pkg.peerDependencies),
    ],
    //treeshake: {
    //  moduleSideEffects: false,
    //  propertyReadSideEffects: false,
    //  tryCatchDeoptimization: false,
    //},
    plugins: [
        typescript({
            tsconfig: "tsconfig.json",
        }),
        // ...(process.env.ROLLUP_WATCH
        //     ? []
        //     : [
        //           //resolve({ extensions: [".js", ".ts"] }),

        //           json(),
        //           conditionalFsEventsImport(),
        //           //common({ extensions: [".js", ".ts"] }),
        //           // pluginTerser({ sourcemap: true }),
        //       ]),
    ],
};
