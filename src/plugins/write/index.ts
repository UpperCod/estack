import path from "path";
import { Plugin } from "estack";
import { writeFile, copyFile } from "../../utils/fs";
import { minify as minifyJs } from "terser";

export function pluginWrite(dest: string): Plugin {
    return {
        name: "plugin-write",
        async buildEnd(build) {
            const { files, options } = build;
            const task = [];
            const minify = !options.sourcemap && options.mode == "build";
            for (const src in files) {
                const file = files[src];
                if (!file.write) continue;
                const destWrite = path.join(dest, file.dest);
                if (typeof file.content == "string") {
                    let { content } = file;
                    // css-type files are compressed directly in the css plugin
                    // since it is synchronized with rollup for the construction of modules
                    if (minify) {
                        if (file.type == "js") {
                            const result = await minifyJs(content, {
                                ecma: 2018,
                                module: true,
                            });
                            content = result.code;
                        }
                        if (file.type == "html") {
                            /**
                             * @todo
                             * find an alternative to html-minifier.
                             * It cannot be attached to the bundle due
                             * to poor handling of dependencies
                             */
                        }
                    }
                    task.push(writeFile(destWrite, content));
                } else {
                    task.push(copyFile(file.src, destWrite));
                }
            }
            await Promise.all(task);
        },
    };
}
