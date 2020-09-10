import { Plugin, OptionsBuild, Build, File, WatchConfig } from "estack";
import * as glob from "fast-glob";
import { Load } from "./types";
import { createBuild } from "./create-build";
import { loadOptions } from "./load-options";
import { createWatch } from "./create-watch";
import { pluginsParallel, pluginsSequential } from "./plugins";
import { pluginHtml } from "../plugins/html";
import { pluginServer } from "../plugins/server";
import { log } from "../utils/log";
import { createMarks } from "../utils/mark";

export async function build(opts: OptionsBuild) {
    const options = await loadOptions(opts);

    const listSrc = await glob(options.glob);

    const mark = createMarks();

    const plugins: Plugin[] = [pluginHtml(), pluginServer()];

    /**
     * Load loads files into plugins for manipulation
     */
    const load: Load = async (file) => {
        if (file.assigned) return;
        /**
         * Clean the errors to check if they have been corrected
         */
        file.errors = [];
        /**
         * Avoid reassignments to plugins from the file
         */
        file.assigned = true;
        /**
         * Plugins that manipulate types run sequentially
         */
        const pipe = plugins.filter((plugin) =>
            plugin.filter ? plugin.filter(file) : false
        );
        if (pipe.length) {
            await pipe.reduce(
                (promise, plugin) =>
                    promise.then(() => plugin.load(file, build)),
                Promise.resolve()
            );
        }
    };

    /**
     * The cycles are parallel processes sent from the build,
     * the cyclos communicate to the plugin the status of the build
     * @param src
     */
    const rebuild = async (src: string[] = []) => {
        const closeMark = mark("build");
        console.log("");
        log({ message: `[time] [bold.green $]`, params: ["Build start."] });
        await pluginsSequential("buildStart", plugins, build);
        await pluginsParallel("beforeLoad", plugins, build);
        await Promise.all(src.map((src) => build.addFile(src, { root: true })));
        await pluginsParallel("afterLoad", plugins, build);
        await pluginsSequential("buildEnd", plugins, build);

        let errors = 0;
        let files = 0;
        for (let src in build.files) {
            files++;
            const file = build.files[src];
            if (file.errors.length) {
                if (!errors) console.log("");
                errors += file.errors.length;
                log({
                    items: [
                        {
                            message: file.src,
                            items: file.errors.map((message) => ({
                                message,
                            })),
                        },
                    ],
                });
            }
        }

        if (errors) console.log("");

        log({
            message: `[time] [bold.green $], Files with errors ${
                errors ? "[bold.red $]" : "[bold.blue $]"
            }${options.watch ? ", waiting for changes..." : ""}`,
            params: [`Build files in ${closeMark()}`, errors + "/" + files],
        });
    };

    const build = createBuild(
        /**
         * Actions are functions that allow you to
         * communicate from the build events object.
         * This object allows isolating the cyclo and
         * watch processes from the build
         */
        {
            load,
            watch: (file) => {
                if (watcher) watcher.add(file.src);
            },
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

    build.options = options;
    build.rebuild = rebuild;

    const watcher = options.watch ? createWatch(build) : null;

    await pluginsParallel("mounted", plugins, build);

    await rebuild(listSrc);
}
