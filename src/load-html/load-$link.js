import path from "path";
import { isHtml } from "../utils/utils";
/**
 *
 * @param {import("../create-build").build} build
 * @param {(file:string)=>Promise<import("../create-build").dest>} addFile
 * @returns {import("@uppercod/map-object").Plugin}
 */
export const $link = (build, addFile) => async ({ file, value }) => {
    const { dir } = path.parse(file);
    const src = path.join(dir, value);

    /**@type {()=>import("./load-html-files").data} */
    let getData;

    if (isHtml(src)) {
        getData = () => {
            try {
                return build.getFile(src).page.data;
            } catch (e) {
                throw `The file ${src} has not been associated with the EStack`;
            }
        };
    } else {
        const dest = await addFile(src);
        getData = () => dest;
    }

    return {
        get link() {
            return getData().link;
        },
        get linkTitle() {
            const data = getData();
            return data.linkTitle || data.title;
        },
        toString() {
            return getData().link;
        },
    };
};
