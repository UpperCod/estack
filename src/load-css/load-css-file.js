import path from "path";
import { compile, serialize, stringify } from "stylis";
import { readFile as fsReadFile } from "../utils/utils";

let createCaptureMetaCss = (type) =>
    RegExp(String.raw`@${type}\s*(?:|\"|\')([^\"\']+)(?:|\"|\');`);

let regValueUse = createCaptureMetaCss("use");
let regValueImport = createCaptureMetaCss("import");
let regValueNamespace = createCaptureMetaCss("namespace");

export async function loadCssFile(
    { file, code, readFile, addWatchFile },
    imports = {},
    returnRules,
    useRules = [],
    namespace = ""
) {
    let { dir } = path.parse(file);

    code = code.replace(regValueNamespace, (nm, value) => {
        namespace += (namespace ? " " : "") + value;
        return "";
    });

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
                    let value = RegExp(
                        "^" +
                            (namespace ? namespace + "\\s+" : "") +
                            child.value
                                .replace(regValueUse, "$1")
                                .replace(/^keyframes *(.+)/, "keyframes:$1")
                                .replace(/([\.\]\[\)\(\:])/g, "\\$1")
                    );

                    if (!useRules.includes(value)) {
                        useRules.push(value);
                    }
                }
                if (child.type == "@import") {
                    let value = child.value.replace(regValueImport, "$1");
                    let file = path.join(dir, value);
                    if (!imports[file]) {
                        imports[file] = true;
                        try {
                            let code = await (readFile || fsReadFile)(file);
                            addWatchFile(file);
                            return readCss(
                                { file, code, readFile, addWatchFile },
                                imports,
                                true,
                                useRules,
                                namespace
                            );
                        } catch (e) {
                            let file = path.join("node_modules", value);
                            try {
                                let code = await (readFile || fsReadFile)(file);
                                return readCss(
                                    { file, code, readFile, addWatchFile },
                                    imports,
                                    true,
                                    useRules,
                                    namespace
                                );
                            } catch (e) {}
                        }
                    }
                    return [];
                }
                return child;
            }
        )
    );

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
    return serialize(rules, stringify);
}
