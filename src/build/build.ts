import { Plugin, OptionsBuild } from "estack";
import * as glob from "fast-glob";
import { Load } from "./types";
import { createBuild } from "./create-build";
import { loadOptions } from "./load-options";
import { pluginHtml } from "../plugins/html";
import { pluginsParallel, pluginsSequential } from "./plugins";
import { createWatch } from "../create-watch";
export async function build(opts: OptionsBuild) {
    const options = await loadOptions(opts);

    const listSrc = await glob(options.glob);

    const plugins: Plugin[] = [pluginHtml()];

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
        const pipe = plugins.filter((plugin) => plugin.filter(file));
        if (pipe.length) {
            await pipe.reduce(
                (promise, plugin) =>
                    promise.then(() => plugin.load(file, build)),
                Promise.resolve()
            );
        }
    };
    /**
     * Capture the last cycle as a promise to execute
     * tasks at the end of this
     */
    let currentCycle: Promise<void>;
    /**
     * The cycles are parallel processes sent from the build,
     * the cyclos communicate to the plugin the status of the build
     * @param src
     */
    const cycle = (src: string[]) =>
        (currentCycle = new Promise(async (resolve, reject) => {
            await pluginsSequential("buildStart", plugins, build);
            await pluginsParallel("beforeLoad", plugins, build);
            await Promise.all(src.map((src) => build.addFile(src)));
            await pluginsParallel("afterLoad", plugins, build);
            await pluginsSequential("buildEnd", plugins, build);
            resolve();
        }));

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
                if (watcher.add) watcher.add(file.src);
            },
            error: async (file) => {
                await currentCycle;
                console.log(file.src);
                file.errors.map((error) => console.log(error));
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

    await pluginsParallel("mounted", plugins, build);

    await cycle(listSrc);

    const watcher = options.watch
        ? createWatch({
              glob: options.glob,
              listener({ change, unlink, add }) {},
          })
        : null;
}
