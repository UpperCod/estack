import path from "path";
import getProp from "@uppercod/get-prop";
import { isUrl } from "../utils/utils";

export const yamlRef = ({ readFile, request }) => async (value, root, file) => {
    const { dir } = path.parse(file);
    const [, src, prop] = value.match(/([^~#]*)(?:(?:~|#\/){0,1}(.+)){0,1}/);
    if (src) {
        try {
            const isUrlSrc = isUrl(src);
            file = isUrlSrc ? src : path.join(dir, src);
            value = await (isUrlSrc ? request : readFile)(file);
        } catch (e) {
            return { file, value };
        }
    }
    return {
        file,
        value: src ? value : getProp(root, prop),
        after: prop ? (data) => getProp(data, prop) : false,
    };
};
