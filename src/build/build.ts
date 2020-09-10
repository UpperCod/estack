import { Plugin, OptionsBuild } from "estack";
import { Load } from "./types";
import { createBuild } from "./create-build";
import { loadOptions } from "./load-options";
import { pluginHtml } from "../plugins/html";
import * as glob from "fast-glob";

export async function build(opts: OptionsBuild) {
    const options = await loadOptions(opts);

    const listSrc = await glob(options.glob);

    const plugins: Plugin[] = [pluginHtml()];

    const load: Load = async (file) => {
        if (file.assigned) return;
        file.assigned = true;
        const pipe = plugins.filter((plugin) => plugin.filter(file));
        if (pipe.length) {
            await pipe.reduce(
                (promise, plugin) =>
                    promise.then(() => plugin.load(file, build)),
                Promise.resolve()
            );
        }
    };

    const build = createBuild(
        /**
         * Actions
         */
        {
            load,
            watch: (file) => {},
        },
        /**
         * Config
         */
        {
            href: "/",
            assets: "assets/",
            types: {
                jsx: "js",
                ts: "js",
                tsx: "js",
                md: "html",
            },
        }
    );

    const cycle = async (src: string[]) => {
        await Promise.all(src.map((src) => build.addFile(src)));
    };

    await cycle(listSrc);
}
