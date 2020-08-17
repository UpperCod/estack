import { Liquid, Tokenizer, evalToken } from "liquidjs";
import { renderMarkdown, highlighted } from "./render-markdown";

import {
    getProp,
    normalizeLineSpace,
    mapPropToObject,
    isJs,
    normalizePath,
} from "../utils/utils";

import {
    DATA_FRAGMENTS,
    DATA_PAGE,
    DATA_LAYOUT,
    FROM_LAYOUT,
    PAGE_ASSETS,
} from "../constants";

let cache = {};

let engine = new Liquid({
    cache: false,
    dynamicPartials: false,
});
/**
 * render a document using liquidjs
 * @param {string} code
 * @param {object} [data]
 * @returns {Promise<string>}
 */
export function renderHtml(code, data) {
    cache[code] = cache[code] || engine.parse(code);
    return engine.render(cache[code], data);
}
/**
 * Create a group array based on property defined between elements
 * @example
 * input : `[{tag:"a"},{tag:"b"}]`
 * output : `["a",[{tag:"a"}],"b",[{tag:"b"}]]`
 */
engine.registerFilter("group", (data, by, def) => {
    let groups = {};

    data.forEach((data) => {
        let value = getProp(data, by, def);
        if (!groups[value]) {
            groups[value] = [];
        }
        groups[value].push(data);
    });

    return Object.keys(groups)
        .sort()
        .map((prop) => ({ title: prop, items: groups[prop] }));
});
/**
 * Apply markdown as a liquid filter
 */
engine.registerFilter("markdown", (string) =>
    renderMarkdown(normalizeLineSpace(string))
);
/**
 * Apply markdown as a liquid filter
 */
engine.registerFilter("slug", normalizePath);
/**
 * Apply markdown as a prismjs filter
 */
engine.registerFilter("highlighted", (string, type) =>
    highlighted(normalizeLineSpace(string), type)
);

/**
 *
 * @param {object} environments - render scope
 * @param {string} name - name of the asset to register
 * @param {object} [data] - Lets configure the asset
 * @param {boolean} [data.tag] - return the asset as a tag, only valid for .js and .css
 * @param {boolean} [data.async] - define the async attribute in the tag
 * @param {boolean} [data.defer] - define the defer attribute in the tag
 * @param {string} [data.insert] - add a key to page Assets, to be replaced when creating the page
 * @param {string} [data.media] - add a key to page Assets, to be replaced when creating the page
 * @param {(boolean|string)} [data.preload] - create a secondary tag that declares the preload
 *                                            of the resource {@link https://html.spec.whatwg.org/multipage/links.html#link-type-preload}
 * @returns {Promise<string>}
 */
async function asset(
    {
        [DATA_PAGE]: _page,
        [DATA_LAYOUT]: _layout,
        [FROM_LAYOUT]: fromLayout,
        [PAGE_ASSETS]: _pageAssets,
    },
    name,
    data
) {
    let addFile = fromLayout
        ? _layout && _layout.addFile
        : _page && _page.addFile;
    if (addFile) {
        let file = await addFile(name);
        if (data && data.tag) {
            if (!_pageAssets[file]) {
                _pageAssets[file] = true;
                let css = !isJs(file);

                let deferOrAsync = data.async
                    ? "async"
                    : data.defer
                    ? "defer"
                    : "";

                let tag = css
                    ? `<link rel="stylesheet" href="${file}" ${
                          data.media ? `media="${data.media}"` : ""
                      }>`
                    : `<script type="module" src="${file}" ${deferOrAsync}></script>`;

                if (data.preload) {
                    tag =
                        (css
                            ? `<link rel="preload" href="${file}" as="style">`
                            : `<link rel="${
                                  data.preload == "preload"
                                      ? "preload"
                                      : "modulepreload"
                              }" href="${file}" as="script">`) + tag;
                }

                if (data.insert) {
                    (_pageAssets[data.insert] =
                        _pageAssets[data.insert] || []).push(tag);
                } else {
                    return tag;
                }
            }
            return "";
        }
        return file;
    }
}

engine.registerFilter("asset", async function (file, ...options) {
    let { environments } = this.context;
    let data = {};
    options.forEach(([prop, value]) => {
        if (typeof prop == "string") data[prop] = value;
    });
    return asset(environments, file, data);
});

/**
 * It allows including fragments of html, these have a scope limited only to your document
 * the fragments will only inherit the data associated with it
 */
engine.registerTag(
    "fragment",
    createTag((pageData, name, data) => {
        let { [DATA_FRAGMENTS]: _fragments = {} } = pageData;
        let fragment = _fragments[name];
        return fragment
            ? renderHtml(fragment.data.content, {
                  ...fragment.data,
                  content: null,
                  ...data,
                  [DATA_PAGE]: fragment,
                  [PAGE_ASSETS]: pageData[PAGE_ASSETS],
                  [FROM_LAYOUT]: false,
              })
            : "";
    })
);

/**
 * Execute the addDataFetch function associated with the page context
 * @example
 * {% fetch myData = "https://my-api" %}
 * {{myData | json}}
 * {{page.fetch.myData}}
 */

engine.registerTag(
    "fetch",
    createTag(
        async (
            {
                [DATA_PAGE]: _page,
                [DATA_LAYOUT]: _layout,
                [FROM_LAYOUT]: fromLayout,
            },
            name,
            data,
            set
        ) => {
            let addDataFetch = fromLayout
                ? _layout && _layout.addDataFetch
                : _page && _page.addDataFetch;
            if (addDataFetch) {
                set(name, await addDataFetch(null, data));
            }
            return "";
        }
    )
);

/**
 *
 * @param {Tag} next - function in charge of processing the tag context
 */
function createTag(next) {
    return {
        parse({ args }) {
            let tokenizer = new Tokenizer(args);

            this.name = tokenizer
                .readFileName()
                .content.replace(/^("|')|("|')$/g, "");

            tokenizer.skipBlank();
            if (tokenizer.peek() === "=") {
                this.type = "=";
                tokenizer.advance();
                this.value = tokenizer.remaining();
            } else {
                let withValue = tokenizer.readWord();
                if (withValue && withValue.content == "with") {
                    tokenizer.skipBlank();
                    this.value = tokenizer.readHashes();
                }
            }
        },
        async render(scope) {
            let data =
                this.type == "="
                    ? await this.liquid.evalValue(this.value, scope)
                    : this.value
                    ? await Promise.all(
                          this.value.map(async (hash) => {
                              return {
                                  prop: hash.name.content,
                                  value: evalToken(hash.value, scope),
                              };
                          })
                      ).then(mapPropToObject)
                    : {};

            return next.call(
                this,
                scope.environments,
                this.name,
                data,
                (name, value) => (scope.bottom()[name] = value)
            );
        },
    };
}
/**
 * @callback Tag
 * @param {object} scope - Second parameter inherited from render, eg : render(code,scope).
 * @param {string} name  - name variable used as the first argument to the tag
 * @param {object} [data] - arguments obtained from the tag invocation
 * @param {(name:string,value:any)=>any} [define] a local value as a variable
 */
