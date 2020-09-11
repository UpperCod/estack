import * as path from "path";
import { Plugin } from "estack";
import { writeFile, copyFile } from "../../utils/fs";

export function pluginWrite(dest: string): Plugin {
    return {
        name: "plugin-write",
        async buildEnd(build) {
            const { files } = build;
            const task = [];
            for (const src in files) {
                const file = files[src];
                if (!file.write) continue;
                const destWrite = path.join(dest, file.dest);
                if (typeof file.content == "string") {
                    task.push(writeFile(destWrite, file.content));
                } else {
                    task.push(copyFile(file.src, destWrite));
                }
            }
            await Promise.all(task);
        },
    };
}
