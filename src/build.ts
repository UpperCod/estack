import { OptionsBuild } from "estack";
import { loadOptions } from "./build/load-options";
import { pluginData } from "./plugins/data";
import { pluginHtml } from "./plugins/html";
import { pluginServer } from "./plugins/server";
import { pluginCss } from "./plugins/css";
import { pluginJs } from "./plugins/js";
import { pluginWrite } from "./plugins/write";
import { createBuild } from "./build/create-build";

export async function build(opts: OptionsBuild) {
    const options = await loadOptions(opts);
    return createBuild(opts, [
        pluginData(),
        pluginHtml(),
        pluginCss(),
        pluginJs(),
        options.server ? pluginServer() : pluginWrite(options.dest),
    ]);
}
