import { Plugin } from "estack";
import { writeFile, copyFile } from "../../utils/fs";

export function pluginWrite(): Plugin {
    return {
        name: "plugin-write",
        buildEnd(build) {
            const { files } = build;
            const task = [];
            for (const src in files) {
                const file = files[src];
                if (!file.write) continue;
                if (typeof file.content == "string") {
                    task.push(writeFile(file.dest, file.content));
                } else {
                    task.push(copyFile(file.src, file.dest));
                }
            }
        },
    };
}
