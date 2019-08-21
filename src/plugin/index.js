import path from "path";

import match from "picomatch";
import html from "parse5";

import postcss from "postcss";
import postcssPresetEnv from "postcss-preset-env";
import cssnano from "cssnano";
import easyImport from "postcss-easy-import";
import { normalizePath } from "../utils";

let isHTML = match("**/*.html");
let isCSS = match("**/*.css");

let ignore = ["#text", "#comment"];

let inject = `[[${Math.random()}]]`;

let cwd = process.cwd();

function patch(fragment, scripts) {
	let length = fragment.length;
	for (let i = 0; i < length; i++) {
		let node = fragment[i];

		if (ignore.includes(node.nodeName)) continue;

		if (node.nodeName == "script") {
			let length = node.attrs.length;
			let isModule;
			let src;
			while (length--) {
				let { name, value } = node.attrs[length];
				if (name == "type" && value == "module") {
					isModule = true;
				}
				if (name == "src" && /^\.\//.test(value)) {
					src = value;
				}
			}
			if (isModule && src) {
				let isInject = scripts.push(src) == 1;

				fragment[i] = {
					nodeName: isInject ? "#comment" : "#text",
					[isInject ? "data" : "value"]: isInject ? inject : "",
					parentNode: fragment[i].parentNode
				};
			}
		} else {
			node.childNodes && patch(node.childNodes, scripts);
		}
	}
	return fragment;
}

export default function(options = {}) {
	let bundleHTML = {};
	let bundleCSS = {};
	let entries;
	return {
		name: "bundle",
		options(opts) {
			entries = [].concat(opts.input);
		},
		async transform(code, id) {
			let file = normalizePath(path.relative(cwd, id));
			let input = entries.includes(file);
			if (isCSS(id)) {
				let { css } = code.trim()
					? await postcss([
							easyImport(),
							postcssPresetEnv({
								browsers: options.browsers
							}),
							...(options.watch ? [] : [cssnano()])
					  ]).process(code)
					: "";

				if (input) {
					bundleCSS[id] = { css };
				}
				return {
					code: input ? "" : "export default  `" + css + "`;",
					map: { mappings: "" }
				};
			}

			if (isHTML(id) && input) {
				let scripts = [];

				let document = patch([].concat(html.parse(code)), scripts)
					.map(node => html.serialize(node))
					.join("");

				bundleHTML[id] = {
					document,
					code:
						scripts
							.map(src => `import ${JSON.stringify(src)}`)
							.join(";") || ""
				};

				return {
					code: bundleHTML[id].code,
					map: { mappings: "" }
				};
			}
		},
		generateBundle(opts, bundle) {
			for (let key in bundle) {
				let { isEntry, facadeModuleId } = bundle[key];
				if (isEntry && isCSS(facadeModuleId)) {
					delete bundle[key];
				}
			}
			for (let key in bundleCSS) {
				let { css } = bundleCSS[key];
				let { base: fileName } = path.parse(key);
				bundle[fileName] = {
					fileName,
					isAsset: true,
					source: css
				};
				delete bundleCSS[key];
			}
			for (let key in bundleHTML) {
				let { document, code } = bundleHTML[key];
				let { base: fileName } = path.parse(key);
				bundle[fileName] = {
					fileName,
					isAsset: true,
					source: document.replace(`<!--${inject}-->`, () => {
						if (!code) return "";
						let src = `./${fileName.replace(/\.html$/, ".js")}`;
						return options.shimport
							? `
									<script>
									function shimport(src) {
										try {
										new Function('import("' + src + '")')();
										} catch (e) {
										var s = document.createElement('script');
										s.src = 'https://unpkg.com/shimport';
										s.dataset.main = src;
										document.head.appendChild(s);
										}
									}
									shimport('${src}');
									</script>
									`
							: `<script type="module" src="${src}"></script>`;
					})
				};
				delete bundleHTML[key];
			}
		}
	};
}
