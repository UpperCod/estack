import builtins from "builtin-modules";
import json from "@rollup/plugin-json";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import pkg from "./package.json";
import tsconfig from "./tsconfig.json";
import typescript from "@rollup/plugin-typescript";

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
        typescript({
            tsconfig: "tsconfig.json",
            ...tsconfig.compilerOptions,
            module: "ESnext",
        }),
        json(),
        resolve(),
        commonjs(),
    ],
};
