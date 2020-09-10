import { Plugin } from "estack";
import { isYaml, isJson } from "../../utils/types";
import { loadData } from "./load-data";

export function pluginData(): Plugin {
    return {
        name: "data",
        filter: ({ src }) => isYaml(src) || isJson(src),
        async load(file, build) {
            await loadData(file, build);
        },
    };
}
