import url from "url";
import lexer from "es-module-lexer";
import { isUrl } from "../utils/types";

const REF = {};
const UID = {};
const SPACE = "\0_request_";
const LOAD = {};
/**
 * @param {import("../internal").build} build
 * @returns {import("rollup").Plugin}
 */
export let pluginImportUrl = (build) => ({
    name: "plugin-import-url",
    async resolveId(id) {
        if (isUrl(id)) {
            if (!REF[id]) {
                REF[id] = (Math.random() + "").replace("0.", SPACE);
                UID[REF[id]] = id;
            }
            return REF[id];
        }
    },
    load(id) {
        if (id.startsWith(SPACE)) {
            return (LOAD[id] = LOAD[id] || resolve(build, id));
        }
    },
});
/**
 * @param {import("../internal").build} build
 */
async function resolve(build, id) {
    await lexer.init;
    let [uri, code] = await build.request(UID[id]);
    let [imports] = lexer.parse(code);
    let position = 0;
    let resolve = imports
        .map(({ s, e }) => {
            let str = code.slice(s, e);
            if (!isUrl(str)) {
                return { str, s, e };
            }
        })
        .filter((s) => s)
        .map((data) => {
            return {
                ...data,
                url: url.resolve(uri, data.str),
            };
        })
        .reduce((code, data) => {
            let s = data.s + position;
            let e = data.e + position;
            let str = data.url.split("");
            let before = code.slice(0, s);
            let middle = code.slice(s, e);
            let after = code.slice(e);
            let lMiddle = middle.length;
            let lStr = str.length;
            position += lStr - lMiddle;
            return [...before, ...str, ...after];
        }, code.split(""))
        .join("");
    return resolve;
}
