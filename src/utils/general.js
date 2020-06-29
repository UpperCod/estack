import yaml from "js-yaml";

export let yamlParse = (string) => yaml.safeLoad(string);

export let yamlStringify = (object) => yaml.safeDump(object);

/**
 * Change the catch to null
 * @param {Promise} promise
 */
export let promiseErrorToNull = async (promise) => promise.catch((e) => null);

/**
 * Gets the value of an object based on the index
 * @param {object} value
 * @param {string} prop - search index
 * @param {*} [optionValue] - optional return value in case the index cannot be resolved
 * @returns {any}
 */
export function getProp(value, prop, optionValue) {
    value = value || {};
    let parts = prop.match(/([^\[\]\.]+)/g);
    for (let i = 0; i < parts.length; i++) {
        if (typeof value === "object" && parts[i] in value) {
            value = value[parts[i]];
        } else {
            return optionValue;
        }
    }
    return value;
}

export function normalizeLineSpace(str, repeat = "  ") {
    let lines = str.split(/\n/g);
    let sizes = [];
    let clear = true;
    lines = lines
        .map((line) => {
            let space = 0;
            let escape;
            line = line.split("").reduce((str, char) => {
                if (!escape && /\s/.test(char)) {
                    space++;
                    return str;
                } else {
                    escape = true;
                }
                return (str += char);
            }, "");
            if (!line.trim()) {
                return [-1];
            }

            if (!sizes.includes(space)) sizes.push(space);

            return [space, line];
        })
        .map(([space, line]) =>
            space == -1 ? "" : repeat.repeat(sizes.indexOf(space)) + line
        )
        .filter((value) => {
            if (clear && !value.trim()) {
                return false;
            }
            clear = false;
            return true;
        })
        .join("\n");
    return lines;
}
