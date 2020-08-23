const EMPTY_PROPS = {};
const EMPTY_CHILDREN = [];
const TYPE_ELEMENT = 1;
const vdom = Symbol();
/**
 * @typedef {object} vdom
 * @property {any} type
 * @property {symbol} vdom
 * @property {Object.<string,any>} props
 * @property {import("./internal").flatParamMap} [children]
 * @property {any} [key]
 * @property {boolean} [raw]
 * @property {boolean} [shadow]
 */

/**
 * @param {any} type
 * @param {object} [p]
 * @param  {...any} children
 * @returns {vdom}
 */
function h(type, p, ...children) {
    let props = p || EMPTY_PROPS;

    children = flat(props.children || children, type == "style");

    if (!children.length) {
        children = EMPTY_CHILDREN;
    }

    return {
        vdom,
        type,
        props,
        children,
        key: props.key,
        shadow: props.shadowDom,
        //@ts-ignore
        raw: type.nodeType == TYPE_ELEMENT,
    };
}
/**
 * @param {Array<any>} children
 * @param {boolean} saniate - If true, children only accept text strings
 * @param {import("./internal").flatParamMap} map
 * @returns {any[]}
 */
function flat(children, saniate, map = []) {
    for (let i = 0; i < children.length; i++) {
        let child = children[i];
        if (child) {
            if (Array.isArray(child)) {
                flat(child, saniate, map);
                continue;
            }
            if (child.key != null) {
                if (!map._) map._ = new Map();

                map._.set(child.key, 0);
            }
        }
        let type = typeof child;
        child =
            child == null ||
            type == "boolean" ||
            type == "function" ||
            (type == "object" && (child.vdom != vdom || saniate))
                ? ""
                : child;
        if (saniate) {
            map[0] = (map[0] || "") + child;
        } else {
            map.push(child);
        }
    }
    return map;
}

console.log(h);
