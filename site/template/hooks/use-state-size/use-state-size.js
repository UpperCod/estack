import { useEffect, useState } from "atomico";
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
export function useResizeObserver(ref, proxyObserver) {
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
export function useSize(ref, proxyObserver) {
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
export function useStateSize(value, ref) {
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
