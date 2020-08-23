const HOOK_MOUNT = 1; //Symbol("mount");
const HOOK_MOUNTED = 2; //Symbol("mounted");
const HOOK_UPDATE = 3; //Symbol("update");
const HOOK_UPDATED = 4; //Symbol("updated");
const HOOK_UNMOUNT = 5; //Symbol("unmount");
const HOOK_CURRENT = {};

function update(hook, type) {
    hook[0] && (hook[1] = hook[0](hook[1], type));
}

function updateAll(hooks, type) {
    for (let i in hooks) update(hooks[i], type);
}

function useHook(reducer, initialState) {
    if (HOOK_CURRENT.ref.hook) {
        return HOOK_CURRENT.ref.hook.use(reducer, initialState)[1];
    }
}

function useRender() {
    return HOOK_CURRENT.ref.render;
}

function createHooks(render, host) {
    let hooks = {};
    let mounted;
    let hook = {
        use,
        load,
        updated,
        unmount,
    };

    let ref = { hook, host, render };

    function load(callback, param) {
        HOOK_CURRENT.index = 0;
        HOOK_CURRENT.ref = ref;
        let resolve = callback(param);
        HOOK_CURRENT.ref = 0;
        return resolve;
    }
    function use(reducer, state) {
        let index = HOOK_CURRENT.index++;
        let mount;
        // record the hook and the initial state of this
        if (!hooks[index]) {
            hooks[index] = [null, state];
            mount = 1;
        }
        // The hook always receives the last reduce.
        hooks[index][0] = reducer;
        update(hooks[index], mount ? HOOK_MOUNT : HOOK_UPDATE);
        return hooks[index];
    }
    function updated() {
        let type = mounted ? HOOK_UPDATED : HOOK_MOUNTED;
        mounted = 1;
        updateAll(hooks, type);
    }
    function unmount() {
        updateAll(hooks, HOOK_UNMOUNT);
    }
    return hook;
}

/**
 * compare 2 array
 * @param {array} before
 * @param {array} after
 * @example
 * isEqualArray([1,2,3,4],[1,2,3,4]) // true
 * isEqualArray([1,2,3,4],[1,2,3])   // false
 * isEqualArray([5,1,2,3],[1,2,3,5]) // false
 * isEqualArray([],[]) // true
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

const isFunction = (value) => typeof value == "function";

const isObject = (value) => typeof value == "object";

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

function h(type, props, ...children) {
    props = props || EMPTY_PROPS;

    children = flat(props.children || children);

    if (!children.length) {
        children = EMPTY_CHILDREN;
    }

    return {
        type,
        props,
        children,
        key: props.key,
        shadow: props.shadowDom,
        raw: type.nodeType == TYPE_ELEMENT,
    };
}

function render(vnode, node, id = GLOBAL_ID) {
    diff(id, node, vnode);
}

function diff(id, node, vnode, isSvg) {
    let isNewNode;
    // If the node maintains the source vnode it escapes from the update tree
    if (node && node[id] && node[id].vnode == vnode) return node;
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
                if (vnode.type.nodeType) {
                    return vnode.type;
                }
                nextNode = isSvg
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

        if (keyes && !child.key) continue;

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
 * @param {import("./render").HTMLNode} node
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
        if (!isSvg && !WITH_ATTR[key] && key in node) {
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
 * @param {import("./render").HTMLNode} node
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

function flat(children, map = []) {
    for (let i = 0; i < children.length; i++) {
        let child = children[i];
        if (child) {
            if (Array.isArray(child)) {
                flat(child, map);
                continue;
            }
            if (child.key != null) {
                if (!map._) map._ = new Map();

                map._.set(child.key);
            }
        }
        let type = typeof child;
        child =
            child == null || type == "boolean" || type == "function"
                ? ""
                : child;
        map.push(child);
    }
    return map;
}

/**
 * Alias for null
 */
const Any = null;

/**
 * This class allows to keep the prop system associated with
 * Atomico indifferent to the rest of the core, with the
 * intention of its abstraction for other libraries
 */
class BaseElement extends HTMLElement {
    constructor() {
        super();
        this._create();
    }
    /**
     * starts the queue to execute the update method,
     * This method defines the property this.prevent
     * and this.updated
     */
    async _update() {
        if (!this._prevent) {
            this._prevent = true;
            let resolveUpdate;
            this.updated = new Promise((resolve) => (resolveUpdate = resolve));

            await this.mounted;

            this._prevent = false;
            this.update();

            resolveUpdate();
        }
    }
    static get observedAttributes() {
        let { props = {} } = this;
        let init = [];
        let attrs = [];

        for (let prop in props)
            setProxy(this.prototype, prop, props[prop], attrs, init);
        /**
         * method in charge of starting the class and then calling this.create
         * and after this._update
         */
        this.prototype._create = function () {
            this._attrs = {}; // index associating attribute to a component property
            this._props = {}; // groups the real values of the properties worked by the component

            init.forEach((fn) => fn(this)); // Allows external access to the component instance

            this.mounted = new Promise((resolve) => (this.mount = resolve)); // it is solved when connectedCallback is called
            this.unmounted = new Promise((resolve) => (this.unmount = resolve)); // it is solved when disconnectedCallback is called

            if (this.create) this.create();

            this._update();
        };

        return attrs;
    }
    attributeChangedCallback(attr, oldValue, value) {
        if (attr === this._ignoreAttr || oldValue === value) return;
        // Choose the property name to send the update
        this[this._attrs[attr]] = value;
    }
    connectedCallback() {
        this.mount();
    }
    disconnectedCallback() {
        this.unmount();
    }
}

const dispatchEvent = (node, type, customEventInit) =>
    node.dispatchEvent(
        new CustomEvent(
            type,
            isObject(customEventInit) ? customEventInit : null
        )
    );

const TRUE_VALUES = [true, 1, "", "1", "true"]; // values considered as valid booleans

const NOT_CALLABLE = [Function, Any]; // values that are not executable when defining the property

/**
 * Transform a Camel Case string to a Kebab case
 * @param {string} prop
 * @returns {string}
 */
const getAttr = (prop) => prop.replace(/([A-Z])/g, "-$1").toLowerCase();

/**
 * reflects an attribute value of the given element as context
 * @param {Element} context
 * @param {*} type
 * @param {string} attr
 * @param {*} value
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
 * Constructs the setter and getter of the associated property
 * only if it is not defined in the prototype
 * @param {*} proto
 * @param {string} prop
 * @param {*} schema
 * @param {string[]} attrs
 * @param {Function[]} init
 */
function setProxy(proto, prop, schema, attrs, init) {
    if (!(prop in proto)) {
        let { type, reflect, event, value, attr = getAttr(prop) } =
            isObject(schema) && schema != Any ? schema : { type: schema };

        let isCallable = !NOT_CALLABLE.includes(type);

        attrs.push(attr);

        function set(newValue) {
            let oldValue = this[prop];

            let { error, value } = filterValue(
                type,
                isCallable && isFunction(newValue)
                    ? newValue(oldValue)
                    : newValue
            );

            if (error && value != null) {
                throw `The value defined for prop '${prop}' must be of type '${type.name}'`;
            }

            if (oldValue == value) return;

            this._props[prop] = value;

            this._update();

            this.updated.then(() => {
                if (event) dispatchEvent(this, event);

                if (reflect) {
                    this._ignoreAttr = attr;
                    reflectValue(this, type, attr, this[prop]);
                    this._ignoreAttr = null;
                }
            });
        }

        Object.defineProperty(proto, prop, {
            set,
            get() {
                return this._props[prop];
            },
        });

        init.push((context) => {
            if (value != null) context[prop] = value;
            context._attrs[attr] = prop;
        });
    }
}
/**
 * Filter the values based on their type
 * @param {*} type
 * @param {*} value
 * @returns {{error?:boolean,value:*}}
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
 * Wrap the configuration that unites base-element and Atomico
 * @param {Function} component
 * @returns {HTMLElement}
 */
function createCustomElement(component) {
    let Element = class extends BaseElement {
        async create() {
            let id = Symbol();

            this.update = () => {
                render(hooks.load(component, { ...this._props }), this, id);
                hooks.updated();
            };

            let hooks = createHooks(() => this._update(), this);

            await this.unmounted;

            hooks.unmount();
        }
    };

    Element.props = component.props;

    return Element;
}
/**
 * Create and register an Atomico component as a Webcomponent
 * @param {string|Function} nodeType
 * @param {function} [component]
 */
const customElement = (nodeType, component) =>
    isFunction(nodeType)
        ? createCustomElement(nodeType)
        : customElements.define(nodeType, createCustomElement(component));

function useHost() {
    return useHook(0, { current: HOOK_CURRENT.ref.host });
}

function useState(initialState) {
    let render = useRender();
    return useHook((state, type) => {
        if (HOOK_MOUNT == type) {
            state[0] = isFunction(initialState) ? initialState() : initialState;
            state[1] = (nextState) => {
                nextState = isFunction(nextState)
                    ? nextState(state[0])
                    : nextState;
                if (nextState != state[0]) {
                    state[0] = nextState;
                    render();
                }
            };
        }
        return state;
    }, []);
}

function useEffect(callback, args) {
    // define whether the effect in the render cycle should be regenerated
    let executeEffect;
    useHook((state, type) => {
        if (executeEffect == null) {
            executeEffect =
                args && state[0] ? !isEqualArray(args, state[0]) : true;
            state[0] = args;
        }

        switch (type) {
            case HOOK_UPDATE:
            case HOOK_UNMOUNT:
                // save the current args, for comparison
                if ((executeEffect || type == HOOK_UNMOUNT) && state[1]) {
                    // compare the previous snapshot with the generated state
                    state[1]();
                    // clean the effect collector
                    state[1] = 0;
                }
                // delete the previous argument for a hook
                // run if the hook is inserted in a new node
                // Why? ... to perform again dom operations associated with the parent
                if (type == HOOK_UNMOUNT) {
                    state[0] = null;
                }
                break;
            case HOOK_MOUNTED:
            case HOOK_UPDATED:
                // save the current args, for comparison, repeats due to additional type HOOK_MOUNTED
                if (executeEffect || type == HOOK_MOUNTED) {
                    // save the effect collector
                    state[1] = callback();
                }
                // save the comparison argument
                break;
        }
        return state;
    }, []);
}

// avoiding overloading the browser with multiple instances of ResizeObserver

const RESIZE_OBSERVER = Symbol("ResizeObserver"); // Caches the result of the object returned by getSize

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
    let {
      current
    } = ref; // Create or reuse the listener associated with the resizeObserver event

    if (!current[RESIZE_OBSERVER]) {
      let handlers = [];
      let prevent;
      let observer = new ResizeObserver(([entry]) => {
        observer.entry = entry; // Skip to next fps to ensure styles resize box before eventLoop

        if (prevent) return;
        prevent = true;
        requestAnimationFrame(() => {
          handlers.forEach(handler => handler(entry));
          prevent = false;
        });
      });
      observer.handlers = handlers;
      observer.observe(current);
      current[RESIZE_OBSERVER] = observer;
    }

    let {
      handlers,
      entry
    } = current[RESIZE_OBSERVER];

    let handler = entry => (proxyObserver || setState)(entry);

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
 */

function useSize(ref, proxyObserver) {
  let getState = resizeObserverEntry => {
    if (resizeObserverEntry) {
      let {
        contentRect: {
          width,
          height
        }
      } = resizeObserverEntry;
      return [width, height];
    } else {
      return [];
    }
  };

  let nextProxyObserver = proxyObserver ? resizeObserverEntry => proxyObserver(getState(resizeObserverEntry)) : null;
  let resizeObserverEntry = useResizeObserver(ref, nextProxyObserver);
  return !nextProxyObserver && getState(resizeObserverEntry);
}
/**
 *
 * @param {*} value
 * @param {Ref} ref
 */

function useStateSize(value, ref) {
  let sizes = getSizes(value);
  let valueIsArray = sizes.w && sizes.h;
  let [state, setState] = useState(valueIsArray ? [] : null);
  useSize(ref, ([width, height]) => setState(state => {
    let getValue = ([cases, currentSize]) => {
      let media = cases.find(([, size]) => size >= currentSize);
      return media ? media[0] : sizes.default;
    };

    let w = [sizes.w, width];
    let h = [sizes.h, height];

    if (valueIsArray) {
      let nextState = [w, h].map(getValue);
      let newState = Array.isArray(state) ? nextState.some((value, index) => state[index] !== value) : true;

      if (newState) {
        return nextState;
      }
    } else {
      if (sizes.w) {
        return [w].map(getValue).find(value => value);
      } else if (sizes.h) {
        return [h].map(getValue).find(value => value);
      } else {
        return sizes.default;
      }
    }

    return state;
  }));
  return state;
}

function getSizes(value) {
  if (CACHE_SIZES[value]) return CACHE_SIZES[value];
  let sizes = {};
  value.split(/ *, */).forEach(value => {
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

  let sort = ([, a], [, b]) => a > b ? 1 : -1;

  for (let key in sizes) {
    if (Array.isArray(sizes[key])) sizes[key].sort(sort);
  }

  return CACHE_SIZES[value] = sizes;
}

let style = /*css*/ `
    :host{display:grid};
    slot{display:block;flex:0%}
`;

function EasyDocRow({ columns, gap }) {
    let ref = useHost();
    columns = useStateSize(columns, ref);
    gap = useStateSize(gap, ref);
    let { current } = ref;
    let children = [...current.children].map((child, key) => {
        let slot = "slot-" + key;
        child.setAttribute("slot", slot);
        return slot;
    });

    return (
        h('host', { shadowDom: true,}
            , h('style', null
                , style
                , `:host{${columns ? `grid-template-columns:${columns};` : ""}${
                    gap ? `grid-gap:${gap};` : ""
                }}`
            )
            , children.map((name) => (
                h('slot', { name: name,} )
            ))
        )
    );
}

EasyDocRow.props = {
    columns: {
        type: String,
        value: "1fr 1fr 1fr, 1fr 1fr 720w, 1fr 520w",
    },
    gap: {
        type: String,
        value: "3rem",
    },
};

customElement("easy-doc-rows", EasyDocRow);
