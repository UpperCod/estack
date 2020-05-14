import replace from "@rollup/plugin-replace";
import common from "@rollup/plugin-commonjs";
import resolve from "@rollup/plugin-node-resolve";
import json from "@rollup/plugin-json";
import builtins from "builtin-modules";
import pkg from "./package.json";

export default {
  input: "src/cli.js",
  output: {
    file: "cli.js",
    format: "cjs",
    banner: "#!/usr/bin/env node",
  },
  external: [...builtins, ...Object.keys(pkg.dependencies)],
  plugins: [
    replace({
      "PKG.VERSION": pkg.version,
    }),
    resolve({}),
    json(),
    common(),
  ],
};
