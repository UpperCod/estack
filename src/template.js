import { Liquid, Tokenizer, evalToken } from "liquidjs";
import { renderMarkdown, highlighted } from "./markdown";
import { getProp, normalizeLineSpace, resolvePath } from "./utils/utils";
import {
    DATA_FRAGMENTS,
    DATA_PAGE,
    DATA_LAYOUT,
    FROM_LAYOUT,
} from "./constants";

export function createRenderHtml() {
    let cache = {};

    let engine = new Liquid({
        cache: false,
        dynamicPartials: false,
    });

    function renderHtml(code, data) {
        cache[code] = cache[code] || engine.parse(code);
        return engine.render(cache[code], data);
    }

    engine.registerFilter("group", (data, by) => {
        let groups = {};

        data.forEach((data) => {
            let value = getProp(data, by);
            if (!groups[value]) {
                groups[value] = [];
            }
            groups[value].push(data);
        });

        return Object.keys(groups)
            .sort()
            .map((prop) => ({ group: prop, items: groups[prop] }));
    });

    engine.registerFilter("markdown", (string) =>
        renderMarkdown(normalizeLineSpace(string))
    );

    engine.registerFilter("highlighted", (string, type) =>
        highlighted(normalizeLineSpace(string), type)
    );

    engine.registerFilter("asset", async function (file) {
        let {
            environments: {
                [DATA_PAGE]: _page,
                [DATA_LAYOUT]: _layout,
                [FROM_LAYOUT]: fromLayout,
            },
        } = this.context;

        let addFile = fromLayout
            ? _layout && _layout.addFile
            : _page && _page.addFile;
        if (addFile != null) {
            file = (await addFile(file)).src;
        }

        return file;
    });

    engine.registerFilter("link", function (link) {
        let {
            environments: { page, layout, [FROM_LAYOUT]: fromLayout },
        } = this.context;

        let currentLink = fromLayout ? layout.link : page && page.link;

        if (currentLink != null) {
            return resolvePath(link, currentLink);
        }
        return link;
    });
    /**
     * It allows including fragments of html, these have a scope limited only to your document
     * the fragments will only inherit the data associated with it
     */
    engine.registerTag(
        "fragment",
        createTag(async ({ [DATA_FRAGMENTS]: _fragments = {} }, name, data) => {
            let fragment = _fragments[name];
            return fragment
                ? renderHtml(fragment.content, {
                      ...fragment,
                      content: null,
                      ...data,
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
                    set(name, await addDataFetch(name, data));
                }
                return "";
            }
        )
    );

    return renderHtml;
}

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
                      ).then((data) =>
                          data.reduce((data, { prop, value }) => {
                              data[prop] = value;
                              return data;
                          }, {})
                      )
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
 * @param {(name:string,value:any)=>any} - define a local value as a variable
 */
