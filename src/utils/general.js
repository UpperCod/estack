import yaml from "js-yaml";

export let yamlParse = (string) => yaml.safeLoad(string);

export let yamlStringify = (object) => yaml.safeDump(object);

/**
 * Change the catch to null
 * @param {Promise} promise
 */
export let promiseErrorToNull = async (promise) => promise.catch((e) => null);

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
/**
 * Transform a prop map to an object
 * @param {({prop:string,value:any}[])} list
 * @returns {{[prop:string]:any}}
 */
export function mapPropToObject(list) {
    let length = list.length;
    let obj = {};
    for (let i = 0; i < length; i++) {
        obj[list[i].prop] = list[i].value;
    }
    return obj;
}
