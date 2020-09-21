import builtins from "builtin-modules";
import json from "@rollup/plugin-json";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import replace from "@rollup/plugin-replace";
import pkg from "./package.json";
import { compilerOptions } from "./tsconfig.json";
import typescript from "@rollup/plugin-typescript";

delete compilerOptions.baseDir;
delete compilerOptions.paths;

export default {
    input: "src/cli.ts",
    output: {
        file: "cli.js",
        format: "cjs",
        banner: "#!/usr/bin/env node",
        externalLiveBindings: false,
        freeze: false,
        interop: false,
    },
    external: [
        "estack",
        ...builtins,
        ...Object.keys(pkg.dependencies),
        ...Object.keys(pkg.peerDependencies),
    ],
    plugins: [
        replace({ "PKG.VERSION": pkg.version }),
        ...(process.env.ROLLUP_WATCH ? [] : [json(), resolve(), commonjs()]),
        typescript({
            tsconfig: "tsconfig.json",
            ...compilerOptions,
            module: "ESnext",
        }),
    ],
};
