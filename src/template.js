import { Liquid, Tokenizer, evalToken } from "liquidjs";
import { renderMarkdown, highlighted } from "./markdown";
import { getProp, normalizeLineSpace, resolvePath } from "./utils/utils";
import { DATA_FRAGMENT, DATA_PAGE, DATA_LAYOUT } from "./constants";

export function createRenderHtml() {
    let cache = {};

    let engine = new Liquid({
        cache: false,
        dynamicPartials: false,
    });

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
            environments: { [DATA_PAGE]: _page },
        } = this.context;

        if (_page && _page.addFile) {
            file = (await _page.addFile(file)).src;
        }

        return file;
    });

    /**@todo */

    engine.registerFilter("link", function (link) {
        let {
            environments: { [DATA_PAGE]: _page },
        } = this.context;
        if (_page && _page.link) {
            return resolvePath(link, _page.link);
        }
        return link;
    });

    engine.registerTag(
        "fragment",
        createTag(async ({ [DATA_FRAGMENT]: _fragments = {} }, name, data) => {
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

    engine.registerTag(
        "fetch",
        createTag(async ({ [DATA_PAGE]: addFetch }, name, data) => {
            await addFetch(name, data);
            return "";
        })
    );

    return function renderHtml(code, data) {
        cache[code] = cache[code] || engine.parse(code);
        return engine.render(cache[code], data);
    };
}

function createTag(next) {
    return {
        parse({ args }) {
            let tokenizer = new Tokenizer(args);
            this.name = tokenizer.readFileName().content;
            tokenizer.skipBlank();
            let withValue = tokenizer.readWord();
            if (withValue && /^(with|=)$/.test(withValue.content)) {
                tokenizer.skipBlank();
                this.value = tokenizer.readHashes();
            }
        },
        async render(scope) {
            let data = this.value
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
            return next.call(this, scope.environments, this.name, data);
        },
    };
}
