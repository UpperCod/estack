/**
 * compare 2 array
 * ```js
 * isEqualArray([1,2,3,4],[1,2,3,4]) // true
 * isEqualArray([1,2,3,4],[1,2,3])   // false
 * isEqualArray([5,1,2,3],[1,2,3,5]) // false
 * isEqualArray([],[]) // true
 * ```
 * @param {any[]} before
 * @param {any[]} after
 * @returns {boolean}
 */
function isEqualArray(before, after) {
    let length = before.length;
    if (length !== after.length) return false;
    for (let i = 0; i < length; i++) {
        if (before[i] !== after[i]) return false;
    }
    return true;
}
/**
 * Determine if the value is considered a function
 * @param {any} value
 */
const isFunction = (value) => typeof value == "function";

/**
 * Determines if the value is considered an object
 * @param {any} value
 */
const isObject = (value) => typeof value == "object";

/**
 * The Any type avoids the validation of prop types
 * @type {null}
 **/
const Any = null;

/**
 * Attributes considered as valid boleanos
 * @type {Array<true|1|""|"1"|"true">}
 **/
const TRUE_VALUES = [true, 1, "", "1", "true"];

/**
 * Constructs the setter and getter of the associated property
 * only if it is not defined in the prototype
 * @param {Object} proto
 * @param {string} prop
 * @param {any} schema
 * @param {Object.<string,string>} attrs
 * @param {Object.<string,any>} values
 */
function setPrototype(proto, prop, schema, attrs, values) {
    if (!(prop in proto)) {
        /**@type {Schema} */
        let { type, reflect, event, value, attr = getAttr(prop) } =
            isObject(schema) && schema != Any ? schema : { type: schema };

        let isCallable = !(type == Function || type == Any);

        Object.defineProperty(proto, prop, {
            /**
             * @this {import("./custom-element").BaseContext}
             * @param {any} newValue
             */
            set(newValue) {
                let oldValue = this[prop];

                let { error, value } = filterValue(
                    type,
                    isCallable && isFunction(newValue)
                        ? newValue(oldValue)
                        : newValue
                );

                if (error && value != null) {
                    throw {
                        message: `The value defined for prop '${prop}' must be of type '${type.name}'`,
                        value,
                        target: this,
                    };
                }

                if (oldValue == value) return;

                this._props[prop] = value;

                this.update();

                this.updated.then(() => {
                    if (event) dispatchEvent(this, event);

                    if (reflect) {
                        this._ignoreAttr = attr;
                        reflectValue(this, type, attr, this[prop]);
                        this._ignoreAttr = null;
                    }
                });
            },
            /**
             * @this {import("./custom-element").BaseContext}
             */
            get() {
                return this._props[prop];
            },
        });

        if (value != null) {
            values[prop] = value;
        }

        attrs[attr] = prop;
    }
}

/**
 * Dispatch an event
 * @param {Element} node - DOM node to dispatch the event
 * @param {Event} event - Event to dispatch on node
 */
const dispatchEvent = (node, { type, ...eventInit }) =>
    node.dispatchEvent(new CustomEvent(type, eventInit));

/**
 * Transform a Camel Case string to a Kebab case
 * @param {string} prop - string to apply the format
 * @returns {string}
 */
const getAttr = (prop) => prop.replace(/([A-Z])/g, "-$1").toLowerCase();

/**
 * reflects an attribute value of the given element as context
 * @param {Element} context
 * @param {any} type
 * @param {string} attr
 * @param {any} value
 */
const reflectValue = (context, type, attr, value) =>
    value == null || (type == Boolean && !value)
        ? context.removeAttribute(attr)
        : context.setAttribute(
              attr,
              isObject(value)
                  ? JSON.stringify(value)
                  : type == Boolean
                  ? ""
                  : value
          );

/**
 * Filter the values based on their type
 * @param {any} type
 * @param {any} value
 * @returns {{error?:boolean,value:any}}
 */
function filterValue(type, value) {
    if (type == Any) return { value };

    try {
        if (type == Boolean) {
            value = TRUE_VALUES.includes(value);
        } else if (typeof value == "string") {
            value =
                type == Number
                    ? Number(value)
                    : type == Object || type == Array
                    ? JSON.parse(value)
                    : value;
        }
        if ({}.toString.call(value) == `[object ${type.name}]`) {
            return { value, error: type == Number && Number.isNaN(value) };
        }
    } catch (e) {}

    return { value, error: true };
}

/**
 * Type any, used to avoid type validation.
 * @typedef {null} Any
 */

/**
 * Interface used by dispatchEvent to automate event firing
 * @typedef {Object} Event
 * @property {string} type - type of event to dispatch.
 * @property {boolean} [bubbles] - indicating whether the event bubbles. The default is false.
 * @property {boolean} [cancelable] - indicating whether the event will trigger listeners outside of a shadow root.
 * @property {boolean} [composed] - indicating whether the event will trigger listeners outside of a shadow root.
 * @property {any} [detail] - indicating whether the event will trigger listeners outside of a shadow root.
 */

/**
 * @typedef {Object} Schema
 * @property {any} [type] - data type to be worked as property and attribute
 * @property {string} [attr] - allows customizing the name as an attribute by skipping the camelCase format
 * @property {boolean} [reflect] - reflects property as attribute of node
 * @property {Event} [event] - Allows to emit an event every time the property changes
 * @property {any} [value] - defines a default value when instantiating the component
 */

/**
 * @type {{index?:number,ref?:any}}
 */
const HOOK_CURRENT = {};

/**
 * @returns {{[index:string]:any}}
 */
function useHost() {
    return useHook(
        (
            state = {
                current: HOOK_CURRENT.ref.host,
            }
        ) => state
    );
}
/**
 * @template T
 * @param {RenderHook} render
 * @param {CollectorHook} [collector]
 * @returns {T}
 */
function useHook(render, collector) {
    return HOOK_CURRENT.ref.use(render, collector);
}
/**
 * @returns {()=>void}
 */
function useRender() {
    return HOOK_CURRENT.ref.render;
}
/**
 *
 * @param {()=>void} render
 * @param {any} host
 */
function createHooks(render, host) {
    /**
     * @type {Object.<string,Hook<any>>}
     **/
    let hooks = {};

    let hook = {
        use,
        load,
        updated,
    };

    let ref = { use, host, render };
    /**
     * @template T,R
     * @param {(param:T)=>R} callback
     * @param {T} param
     * @returns {R}
     */
    function load(callback, param) {
        HOOK_CURRENT.index = 0;
        HOOK_CURRENT.ref = ref;
        let resolve = callback(param);
        HOOK_CURRENT.ref = 0;
        return resolve;
    }
    /**
     * @template T
     * @param {RenderHook} render
     * @param {CollectorHook} [collector]
     */
    function use(render, collector) {
        let index = HOOK_CURRENT.index++;
        hooks[index] = [
            render(hooks[index] ? hooks[index][0] : void 0),
            collector,
        ];
        return hooks[index][0];
    }

    /**
     * @param {boolean} [unmounted]
     */
    function updated(unmounted) {
        for (let index in hooks) {
            let hook = hooks[index];
            if (hook[1]) hook[0] = hook[1](hook[0], unmounted);
        }
    }
    return hook;
}

/**
 * @template T
 * @typedef {[any,CollectorHook]} Hook
 */

/**
 * @callback RenderHook
 * @param {any} state
 * @returns {any}
 */

/**
 * @callback CollectorHook
 * @param {any} state
 * @param {boolean} [unmounted]
 * @returns {any}
 */

const KEY = Symbol("");
const GLOBAL_ID = Symbol("");
const FROM_PROP = {
    id: 1,
    className: 1,
    checked: 1,
    value: 1,
    selected: 1,
};
const WITH_ATTR = {
    list: 1,
    type: 1,
    size: 1,
    form: 1,
    width: 1,
    height: 1,
    src: 1,
};
const EMPTY_PROPS = {};
const EMPTY_CHILDREN = [];
const TYPE_TEXT = 3;
const TYPE_ELEMENT = 1;
const $ = document;
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
 * @param {vdom} vnode
 * @param {Element} node
 * @param {Symbol|string} [id]
 */
let render = (vnode, node, id = GLOBAL_ID) => diff(id, node, vnode);

/**
 * Create or update a node
 * Node: The declaration of types through JSDOC does not allow to compress
 * the exploration of the parameters
 * @param {any} id
 * @param {any} node
 * @param {any} vnode
 * @param {boolean} [isSvg]
 */
function diff(id, node, vnode, isSvg) {
    let isNewNode;
    // If the node maintains the source vnode it escapes from the update tree
    if (node && node[id] && node[id].vnode == vnode) return node;
    // Injecting object out of Atomico context
    if (vnode && vnode.type && vnode.vdom != vdom) return node;

    // The process only continues when you may need to create a node
    if (vnode != null || !node) {
        isSvg = isSvg || vnode.type == "svg";
        isNewNode =
            vnode.type != "host" &&
            (vnode.raw
                ? node != vnode.type
                : node
                ? node.localName != vnode.type
                : !node);

        if (isNewNode) {
            let nextNode;
            if (vnode.type != null) {
                nextNode = vnode.raw
                    ? vnode.type
                    : isSvg
                    ? $.createElementNS(
                          "http://www.w3.org/2000/svg",
                          vnode.type
                      )
                    : $.createElement(
                          vnode.type,
                          vnode.is ? { is: vnode.is } : null
                      );
            } else {
                return $.createTextNode(vnode + "");
            }

            node = nextNode;
        }
    }
    if (node.nodeType == TYPE_TEXT) {
        vnode += "";
        if (node.data != vnode) {
            node.data = vnode || "";
        }
        return node;
    }

    let oldVNode = node[id] ? node[id].vnode : EMPTY_PROPS;
    let oldVnodeProps = oldVNode.props || EMPTY_PROPS;
    let oldVnodeChildren = oldVNode.children || EMPTY_CHILDREN;
    let handlers = isNewNode || !node[id] ? {} : node[id].handlers;

    if (vnode.shadow) {
        if (!node.shadowRoot) {
            node.attachShadow({ mode: "open" });
        }
    }

    if (vnode.props != oldVnodeProps) {
        diffProps(node, oldVnodeProps, vnode.props, handlers, isSvg);
    }

    if (vnode.children != oldVnodeChildren) {
        let nextParent = vnode.shadow ? node.shadowRoot : node;
        diffChildren(id, nextParent, vnode.children, isSvg);
    }

    node[id] = { vnode, handlers };

    return node;
}
/**
 *
 * @param {any} id
 * @param {Element|Node} parent
 * @param {import("./internal").flatParamMap} children
 * @param {boolean} isSvg
 */
function diffChildren(id, parent, children, isSvg) {
    let keyes = children._;
    let childrenLenght = children.length;
    let childNodes = parent.childNodes;
    let childNodesLength = childNodes.length;
    let index = keyes
        ? 0
        : childNodesLength > childrenLenght
        ? childrenLenght
        : childNodesLength;

    for (; index < childNodesLength; index++) {
        let childNode = childNodes[index];

        if (keyes) {
            let key = childNode[KEY];
            if (keyes.has(key)) {
                keyes.set(key, childNode);
                continue;
            }
        }

        index--;
        childNodesLength--;
        childNode.remove();
    }
    for (let i = 0; i < childrenLenght; i++) {
        let child = children[i];
        let indexChildNode = childNodes[i];
        let key = keyes ? child.key : i;
        let childNode = keyes ? keyes.get(key) : indexChildNode;

        if (keyes && childNode) {
            if (childNode != indexChildNode) {
                parent.insertBefore(childNode, indexChildNode);
            }
        }

        if (keyes && child.key == null) continue;

        let nextChildNode = diff(id, childNode, child, isSvg);

        if (!childNode) {
            if (childNodes[i]) {
                parent.insertBefore(nextChildNode, childNodes[i]);
            } else {
                parent.appendChild(nextChildNode);
            }
        } else if (nextChildNode != childNode) {
            parent.replaceChild(nextChildNode, childNode);
        }
    }
}

/**
 *
 * @param {Node} node
 * @param {Object} props
 * @param {Object} nextProps
 * @param {boolean} isSvg
 * @param {Object} handlers
 **/
function diffProps(node, props, nextProps, handlers, isSvg) {
    for (let key in props) {
        if (!(key in nextProps)) {
            setProperty(node, key, props[key], null, isSvg, handlers);
        }
    }
    for (let key in nextProps) {
        setProperty(node, key, props[key], nextProps[key], isSvg, handlers);
    }
}

function setProperty(node, key, prevValue, nextValue, isSvg, handlers) {
    key = key == "class" && !isSvg ? "className" : key;
    // define empty value
    prevValue = prevValue == null ? null : prevValue;
    nextValue = nextValue == null ? null : nextValue;

    if (key in node && FROM_PROP[key]) {
        prevValue = node[key];
    }

    if (nextValue === prevValue || key == "shadowDom") return;

    if (
        key[0] == "o" &&
        key[1] == "n" &&
        (isFunction(nextValue) || isFunction(prevValue))
    ) {
        setEvent(node, key, nextValue, handlers);
    } else if (key == "key") {
        node[KEY] = nextValue;
    } else if (key == "ref") {
        if (nextValue) nextValue.current = node;
    } else if (key == "style") {
        let style = node.style;

        prevValue = prevValue || "";
        nextValue = nextValue || "";

        let prevIsObject = isObject(prevValue);
        let nextIsObject = isObject(nextValue);

        if (prevIsObject) {
            for (let key in prevValue) {
                if (nextIsObject) {
                    if (!(key in nextValue)) setPropertyStyle(style, key, null);
                } else {
                    break;
                }
            }
        }

        if (nextIsObject) {
            for (let key in nextValue) {
                let value = nextValue[key];
                if (prevIsObject && prevValue[key] === value) continue;
                setPropertyStyle(style, key, value);
            }
        } else {
            style.cssText = nextValue;
        }
    } else {
        if (
            (!isSvg && !WITH_ATTR[key] && key in node) ||
            isFunction(nextValue) ||
            isFunction(prevValue)
        ) {
            node[key] = nextValue == null ? "" : nextValue;
        } else if (nextValue == null) {
            node.removeAttribute(key);
        } else {
            node.setAttribute(
                key,
                isObject(nextValue) ? JSON.stringify(nextValue) : nextValue
            );
        }
    }
}

/**
 *
 * @param {Node} node
 * @param {string} type
 * @param {function} [nextHandler]
 * @param {object} handlers
 */
function setEvent(node, type, nextHandler, handlers) {
    // get the name of the event to use
    type = type.slice(type[2] == "-" ? 3 : 2);
    // add handleEvent to handlers
    if (!handlers.handleEvent) {
        /**
         * {@link https://developer.mozilla.org/es/docs/Web/API/EventTarget/addEventListener#The_value_of_this_within_the_handler}
         **/
        handlers.handleEvent = (event) =>
            handlers[event.type].call(node, event);
    }
    if (nextHandler) {
        // create the subscriber if it does not exist
        if (!handlers[type]) {
            node.addEventListener(type, handlers);
        }
        // update the associated event
        handlers[type] = nextHandler;
    } else {
        // 	delete the associated event
        if (handlers[type]) {
            node.removeEventListener(type, handlers);
            delete handlers[type];
        }
    }
}

function setPropertyStyle(style, key, value) {
    let method = "setProperty";
    if (value == null) {
        method = "removeProperty";
        value = null;
    }
    if (~key.indexOf("-")) {
        style[method](key, value);
    } else {
        style[key] = value;
    }
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

/**
 * This function isolates the context used to dispatch updates to the DOM and associate update
 * @param {import("./custom-element").BaseContext} context
 * @param {(props:object)=>object} component
 */
async function setup(context, component) {
    let id = Symbol();
    let hooks = createHooks(() => context.update(), context);
    let prevent;

    context.update = async () => {
        if (!prevent) {
            prevent = true;
            /**@type {()=>void} */
            let resolveUpdate;
            context.updated = new Promise(
                (resolve) => (resolveUpdate = resolve)
            ).then(hooks.updated);

            await context.mounted;

            render(hooks.load(component, { ...context._props }), context, id);

            prevent = false;

            resolveUpdate();
        }
    };

    await context.unmounted;

    hooks.updated(true);
}

/**
 *
 * @param {any} component
 * @param {Base} [Base]
 */
function c(component, Base = HTMLElement) {
    /**
     * @type {Object.<string,string>}
     */
    let attrs = {};
    /**
     * @type {Object.<string,string>}
     */
    let values = {};

    let { props } = component;

    class Element extends Base {
        /**
         * @this BaseContext
         */
        constructor() {
            super();

            this._props = {};

            this.mounted = new Promise((resolve) => (this.mount = resolve));

            this.unmounted = new Promise((resolve) => (this.unmount = resolve));

            setup(this, component);

            for (let prop in values) this[prop] = values[prop];

            this.update();
        }
        connectedCallback() {
            this.mount();
        }
        disconnectedCallback() {
            this.unmount();
        }
        /**
         * @this BaseContext
         * @param {string} attr
         * @param {(string|null)} oldValue
         * @param {(string|null)} value
         */
        attributeChangedCallback(attr, oldValue, value) {
            if (attr === this._ignoreAttr || oldValue === value) return;
            // Choose the property name to send the update
            this[attrs[attr]] = value;
        }
    }

    for (let prop in props) {
        setPrototype(Element.prototype, prop, props[prop], attrs, values);
    }

    Element.observedAttributes = Object.keys(attrs);

    return Element;
}

/**
 * @typedef {typeof HTMLElement} Base
 */

/**
 * @typedef {Object} Context
 * @property {()=>void} mount
 * @property {()=>void} unmount
 * @property {Promise<void>} mounted
 * @property {Promise<void>} unmounted
 * @property {Promise<void>} updated
 * @property {()=>Promise<void>} update
 * @property {Object.<string,any>} _props
 * @property {string} [_ignoreAttr]
 */

/**
 * @typedef {HTMLElement & Context} BaseContext
 */

function useProp(name) {
    let ref = useHost();
    if (name in ref.current) {
        if (!ref[name]) {
            ref[name] = [null, (nextValue) => (ref.current[name] = nextValue)];
        }
        ref[name][0] = ref.current[name];
        return ref[name];
    }
}

function useState(initialState) {
    let render = useRender();
    return useHook((state = []) => {
        if (!state[1]) {
            state[0] = isFunction(initialState) ? initialState() : initialState;
            state[1] = (nextState) => {
                nextState = isFunction(nextState) ? nextState() : nextState;
                if (nextState != state[0]) {
                    state[0] = nextState;
                    render();
                }
            };
        }
        return state;
    });
}
/**
 * @param {()=>void|(()=>void)} currentEffect
 * @param {any[]} [currentArgs]
 */
function useEffect(currentEffect, currentArgs) {
    useHook(
        ([collector, args] = []) => {
            if (args || !args) {
                if (args && isEqualArray(args, currentArgs)) {
                    collector = collector || true;
                } else {
                    if (isFunction(collector)) collector();
                    collector = null;
                }
            }
            return [collector, currentArgs];
        },
        ([collector, args], unmounted) => {
            if (unmounted) {
                if (isFunction(collector)) collector();
            } else {
                return [collector ? collector : currentEffect(), args];
            }
        }
    );
}

// Create a private index on the node,
// avoiding overloading the browser with multiple instances of ResizeObserver
const RESIZE_OBSERVER = Symbol("ResizeObserver");
// Caches the result of the object returned by getSize
const CACHE_SIZES = {};

/**
 * Subscribe to the reference to all size changes
 * @param {Ref} ref
 * @param {(entry:object)=>void} [proxyObserver] - Replace status update with a handler
 * @return {ResizeObserverEntry}
 */
function useResizeObserver(ref, proxyObserver) {
    let [state, setState] = useState();

    useEffect(() => {
        let { current } = ref;
        // Create or reuse the listener associated with the resizeObserver event
        if (!current[RESIZE_OBSERVER]) {
            let handlers = [];
            let prevent;
            //@ts-ignore
            let observer = new ResizeObserver(([entry]) => {
                observer.entry = entry;
                // Skip to next fps to ensure styles resize box before eventLoop
                if (prevent) return;
                prevent = true;
                requestAnimationFrame(() => {
                    handlers.forEach((handler) => handler(entry));
                    prevent = false;
                });
            });
            observer.handlers = handlers;

            observer.observe(current);

            current[RESIZE_OBSERVER] = observer;
        }

        let { handlers, entry } = current[RESIZE_OBSERVER];

        let handler = (entry) => (proxyObserver || setState)(entry);

        handlers.push(handler);

        if (entry) handler(entry);

        return () => {
            handlers.splice(handlers.indexOf(handler) >>> 0, 1);
            if (!handlers.length) {
                current[RESIZE_OBSERVER].disconnect();
                delete current[RESIZE_OBSERVER];
            }
        };
    }, [ref]);

    return state;
}
/**
 * @param {Ref} ref
 * @param {()=>any} [proxyObserver]
 */
function useSize(ref, proxyObserver) {
    let getState = (resizeObserverEntry) => {
        if (resizeObserverEntry) {
            let {
                contentRect: { width, height },
            } = resizeObserverEntry;
            return [width, height];
        } else {
            return [];
        }
    };

    let nextProxyObserver = proxyObserver
        ? (resizeObserverEntry) => proxyObserver(getState(resizeObserverEntry))
        : null;

    let resizeObserverEntry = useResizeObserver(ref, nextProxyObserver);

    return !nextProxyObserver && getState(resizeObserverEntry);
}
/**
 *
 * @param {*} value
 * @param {Ref} ref
 * @returns {string|string[]}
 */
function useStateSize(value, ref) {
    let sizes = getSizes(value);
    let valueIsArray = sizes.w && sizes.h;
    let [state, setState] = useState(valueIsArray ? [] : null);

    useSize(ref, ([width, height]) =>
        setState((state) => {
            let getValue = ([cases, currentSize]) => {
                let media = cases.find(([, size]) => size >= currentSize);
                return media ? media[0] : sizes.default;
            };

            let w = [sizes.w, width];
            let h = [sizes.h, height];
            if (valueIsArray) {
                let nextState = [w, h].map(getValue);

                let newState = Array.isArray(state)
                    ? nextState.some((value, index) => state[index] !== value)
                    : true;
                if (newState) {
                    return nextState;
                }
            } else {
                if (sizes.w) {
                    return [w].map(getValue).find((value) => value);
                } else if (sizes.h) {
                    return [h].map(getValue).find((value) => value);
                } else {
                    return sizes.default;
                }
            }
            return state;
        })
    );
    return state;
}

function getSizes(value) {
    if (CACHE_SIZES[value]) return CACHE_SIZES[value];

    let sizes = {};

    value.split(/ *, */).forEach((value) => {
        let size = value.match(/(.+)\s+(\d+)(w|h)$/);
        if (size) {
            let [, value, number, type] = size;
            number = Number(number);
            sizes[type] = sizes[type] || [];
            sizes[type].push([value, number]);
        } else {
            sizes.default = value;
        }
    });

    let sort = ([, a], [, b]) => (a > b ? 1 : -1);

    for (let key in sizes) {
        if (Array.isArray(sizes[key])) sizes[key].sort(sort);
    }

    return (CACHE_SIZES[value] = sizes);
}

/**
 * @typedef {{borderBoxSize: Object, contentBoxSize: Object, contentRect: DOMRectReadOnly, target: Element}} ResizeObserverEntry
 */

/**
 * @typedef {{current?: Element}} Ref
 */

function docRow({ col, gap: _gap }) {
    const host = useHost();
    const gridTemplateColumns = useStateSize(col, host);
    const gap = useStateSize(_gap, host);
    return h('host', { style: { display: "grid", gridTemplateColumns, gap },});
}

docRow.props = {
    col: {
        type: String,
        value: "1fr 1fr",
    },
    gap: {
        type: String,
        value: "3rem, 2rem 720w, 1rem 520w",
    },
};

customElements.define("doc-row", c(docRow));

var style = ":host {\r\n    display: block;\r\n    width: 100%;\r\n    position: relative;\r\n    overflow: hidden;\r\n    --docTabs_btnColor: unset;\r\n    --docTabs_btnPadding: 12px 20px 8px;\r\n    --docTabs_btnsLine: rgba(0, 0, 0, 0.25);\r\n    --docTabs_btnWeight: 700;\r\n    --docTabs_btn-inactive: #404040;\r\n    --docTabs_btnRadio: 3px;\r\n    --docTabs_btn-fontSize: 0.9em;\r\n    --docTabs_bgColor: #2b2b2b;\r\n}\r\n\r\n.mask {\r\n    width: 100%;\r\n    height: auto;\r\n    border-radius: 0px var(--docTabs_btnRadio) var(--docTabs_btnRadio);\r\n    background: var(--docTabs_bgColor);\r\n    overflow: hidden;\r\n}\r\n\r\n.slides {\r\n    display: flex;\r\n}\r\n.slide {\r\n    max-width: 100%;\r\n    min-width: 100%;\r\n    display: inline-block;\r\n    box-sizing: border-box;\r\n}\r\n\r\n.header {\r\n    display: flex;\r\n    position: relative;\r\n    overflow-x: auto;\r\n}\r\n\r\n.button {\r\n    background: transparent;\r\n    color: var(--docTabs_btnColor);\r\n    padding: var(--docTabs_btnPadding);\r\n    font-weight: var(--docTabs_btnWeight);\r\n    border: none;\r\n    border: none;\r\n    cursor: pointer;\r\n    position: relative;\r\n    outline: none;\r\n    font-size: var(--docTabs_btn-fontSize);\r\n}\r\n\r\n.button_line {\r\n    background: var(--docTabs_bgColor);\r\n    transform-origin: center bottom;\r\n    transform: scale(1, 0);\r\n    transition: 0.3s ease all;\r\n    z-index: 2;\r\n}\r\n\r\n.button-active .button_line {\r\n    transform: scale(1, 1);\r\n}\r\n\r\n.buttons {\r\n    position: relative;\r\n    display: inline-flex;\r\n    align-items: flex-end;\r\n}\r\n\r\n.buttons_line {\r\n    background: var(--docTabs_btnsLine);\r\n}\r\n\r\n.buttons_line,\r\n.button_line {\r\n    width: 100%;\r\n    height: 3px;\r\n    left: 0px;\r\n    bottom: 0px;\r\n    position: absolute;\r\n    border-radius: 5px 5px 0px 0px;\r\n}\r\n";

const staticStyle = h('style', null, style);

function docTab({ tabs, msAnimation, autoHeight }) {
    const [tab, setTab] = useProp("tab");
    const host = useHost();
    const { current } = host;
    const tabsList = tabs.split(/ *, */);

    const heights = [...current.children].map((child, index) => {
        if (child.slot != tabsList[index]) {
            child.slot = tabsList[index];
        }
        child.style.margin = "0px";
        return child.clientHeight + "px";
    });

    return (
        h('host', { items: tabsList, shadowDom: true,}
            , staticStyle
            , h('header', { class: "header",}
                , h('div', { class: "buttons",}
                    , tabsList.map((title, index) => (
                        h('button', {
                            class: 
                                "button " +
                                (index == tab
                                    ? "button-active"
                                    : index == tab - 1
                                    ? "button-prev"
                                    : index == tab + 1
                                    ? "button-next"
                                    : "")
                            ,
                            onclick: () => setTab(index),}
                        
                            , title
                            , h('div', { class: "button_line",})
                        )
                    ))
                    , h('div', { class: "buttons_line",})
                )
            )
            , h('div', { class: "mask",}
                , h('div', {
                    class: "slides",
                    style: `transition:${msAnimation} ease all;transform:translateX(${
                        -100 * tab
                    }%);height:${autoHeight ? heights[tab] : "100%"}`,}
                
                    , tabsList.map((title) => (
                        h('div', { class: "slide",}
                            , h('slot', { name: title,})
                        )
                    ))
                )
            )
        )
    );
}

docTab.props = {
    items: Array,
    tabs: String,
    tab: {
        type: Number,
        value: 0,
    },
    msAnimation: {
        type: String,
        value: ".35s",
    },
    autoHeight: { type: Boolean, reflect: true },
};

customElements.define("doc-tabs", c(docTab));

function docDetails({ summary }) {
    return (
        h('host', { shadowDom: true,}
            , h('details', null
                , h('summary', null, summary)
                , h('slot', null)
            )
        )
    );
}

docDetails.props = {
    summary: {
        type: String,
    },
};

customElements.define("doc-details", c(docDetails));
