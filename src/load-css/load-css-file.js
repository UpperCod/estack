import path from "path";
import { compile, serialize, stringify } from "stylis";
import { readFile as fsReadFile, isUrl } from "../utils/utils";

let alRule = /@(\w+)\s+(?:(?:")([^"]+)(?:")|(?:')([^']+)(?:')){0,1}(?:\s*([^;]+)){0,1}/;

let getAlMeta = (value) => {
    let params = value.match(alRule);
    if (params) {
        let [, type, valueDobleQuote, valueSingleQuote, options] = params;
        return { type, value: valueDobleQuote || valueSingleQuote, options };
    }
};

let templateMedia = compile(`@media print{body{red}}`)[0];

let cache = {};
/**
 * preprocess the css using Stylis
 * @param {object} context
 * @param {string} context.file - current css file
 * @param {string} context.code - css code to analyze
 * @param {import("../internal").request} context.request - read a file
 * @param {import("../internal").readFile} [context.readFile] - read a file
 * @param {(file:string)=>void} context.addWatchFile - execute the callback every time a css import is generated
 * @param {object} [imports]
 * @param {boolean} [returnRules] - If true it will return the rules as Array
 * @param {RegExp[]} [useRules] - Regular expressions to select css rules
 * @param {string} [namespace] - context prefix of file selectors
 * @param {string[]} [headers] - context prefix of file selectors
 * @param {string} [uri]
 * @returns {Promise<string|object[]>}
 */
export async function loadCssFile(
    { file, code, readFile, addWatchFile, request },
    imports = {},
    returnRules,
    useRules = [],
    namespace = "",
    headers = [],
    uri
) {
    let { dir } = path.parse(file);

    /**@type {any[]} */
    let rules = await Promise.all(
        compile(namespace ? `${namespace}{${code}}` : code).map(
            async (child) => {
                /**
                 * the @use type allows defining a search regular
                 * expression to only include the rules that apply
                 * to the imported css
                 * @example
                 * @use "a";
                 * @use ".my-class";
                 * @use ".my-class-*"; .my-class--any
                 * @use ".my-class-*"; .my-class-b:not(c)
                 */
                if (child.type == "@use") {
                    let test = getAlMeta(child.value);
                    let value;
                    if (test) {
                        value = (
                            (namespace ? namespace + "\\s+" : "") +
                            test.value.replace(
                                /^keyframes *(.+)/,
                                "keyframes:$1"
                            )
                        ).replace(/([\.\]\[\)\(\:])/g, "\\$1");
                        value = RegExp(value);
                    }

                    if (!useRules.includes(value)) {
                        useRules.push(value);
                    }
                }
                if (child.type == "@import") {
                    let test = getAlMeta(child.value);

                    if (test) {
                        let fromUrl = isUrl(test.value);
                        let file = fromUrl
                            ? test.value
                            : path.join(uri || dir, test.value);

                        if (!imports[file]) {
                            imports[file] = true;
                            let nextRules;
                            try {
                                let code;
                                if (fromUrl) {
                                    code = await request(file);
                                } else {
                                    let fn = readFile || fsReadFile;
                                    code = await fn(file);
                                }

                                !fromUrl && addWatchFile(file);

                                nextRules = loadCssFile(
                                    {
                                        file,
                                        code,
                                        readFile,
                                        addWatchFile,
                                        request,
                                    },
                                    imports,
                                    true,
                                    useRules,
                                    namespace,
                                    headers,
                                    fromUrl ? file : false
                                );
                            } catch (e) {
                                let file = path.join(
                                    "node_modules",
                                    test.value
                                );
                                try {
                                    let fn = readFile || fsReadFile;
                                    let code = await fn(file);
                                    nextRules = loadCssFile(
                                        {
                                            file,
                                            code,
                                            readFile,
                                            addWatchFile,
                                            request,
                                        },
                                        imports,
                                        true,
                                        useRules,
                                        namespace,
                                        headers
                                    );
                                } catch (e) {}
                            }
                            if (nextRules) {
                                if (test.options) {
                                    return nextRules.then((children) => [
                                        {
                                            ...templateMedia,
                                            value: `@media ${test.options}`,
                                            props: [test.options],
                                            children,
                                        },
                                    ]);
                                }
                                return nextRules;
                            } else {
                                headers.push(child);
                            }
                        }
                    }
                    return [];
                }
                return child;
            }
        )
    );
    // @ts-ignore
    rules = rules.flat();

    if (returnRules && useRules.length) {
        let test = (prop) => useRules.some((reg) => reg.test(prop));
        rules = rules.filter(function filter(child) {
            if (child.type == "@keyframes") {
                return child.props
                    .map((prop) => "keyframes:" + prop)
                    .some(test);
            }

            if (child.type == "@media") {
                child.children = child.children.filter(filter);

                if (!child.children.length) return;
            }
            if (child.type == "rule") {
                return child.props.some(test);
            } else {
                return true;
            }
        });
    }

    if (returnRules) {
        return rules;
    }
    return serialize([...headers, ...rules], stringify);
}
