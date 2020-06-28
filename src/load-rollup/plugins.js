import resolve from "@rollup/plugin-node-resolve";
import json from "@rollup/plugin-json";
import common from "@rollup/plugin-commonjs/dist";
import sucrase from "@rollup/plugin-sucrase";
import replace from "@rollup/plugin-replace";
import { pluginTerser } from "./plugin-terser";

let extensions = [".js", ".jsx", ".ts", ".tsx"];

/**
 *
 * @param {Object} options
 * @param {boolean} options.minify
 * @param {boolean} options.sizes
 * @param {boolean} options.jsx
 * @param {boolean} options.jsxFragment
 * @param {({dest:string,code:string,type:string})=>void} [mountFile] - mount rollup files on development server without writing
 */
export function plugins(options, mountFile) {
    let optionalPlugins = [];

    if (options.minify) {
        optionalPlugins.push(pluginTerser({ sourcemap: options.sourcemap }));
    }

    if (mountFile) {
        optionalPlugins.push({
            type: "mount-file",
            generateBundle(opts, chunks) {
                for (let file in chunks) {
                    let { code, map } = chunks[file];
                    if (opts.sourcemap) {
                        let fileMap = file + ".map";
                        mountFile({
                            dest: fileMap,
                            code: map + "",
                            type: "json",
                        });
                        code += `\n//# sourceMappingURL=${fileMap}`;
                    }
                    mountFile({ dest: file, code, type: "js" });
                    delete chunks[file];
                }
            },
        });
    }

    return [
        replace({
            "process.env.NODE_ENV": JSON.stringify("production"),
        }),
        resolve({
            extensions,
            dedupe: ["react", "react-dom"],
        }),
        json(),
        sucrase({
            exclude: ["node_modules/**"],
            transforms: ["jsx", "typescript"],
            jsxPragma: options.jsx,
            jsxFragmentPragma: options.jsxFragment,
            production: true,
        }),
        common(),
        ...optionalPlugins,
    ];
}
