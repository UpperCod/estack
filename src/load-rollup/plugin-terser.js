import terser from "terser";
import createCache from "@uppercod/cache";
const cache = createCache();
/**
 * rollup-plugin-terser, has dependencies that prevent
 * the generation of the bundle, so a similar effect is used
 * @param {object} options
 * @param {boolean} options.sourcemap
 * @returns {import("rollup").Plugin}
 */
export function pluginTerser({ sourcemap }) {
    return {
        name: "plugin-terser",
        async renderChunk(code, chunk) {
            if (chunk.fileName.endsWith(".js")) {
                return cache(terser.minify, code);
            }
        },
    };
}
