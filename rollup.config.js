import replace from "@rollup/plugin-replace";
import pkg from "./package.json";

export default {
  input: "src/cli.js",
  output: {
    file: "cli.js",
    format: "cjs",
    banner: "#!/usr/bin/env node"
  },
  plugins: [
    replace({
      "PKG.VERSION": pkg.version
    })
  ]
};
