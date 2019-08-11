import path from "path";

import match from "picomatch";
import html from "parse5";

let isHTML = match("**/*.html");

let ignore = ["#text", "#comment"];

let inject = `[[${Math.random()}]]`;

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
				let code = `import * from ${JSON.stringify(src)};`;

				let isInject = scripts.push(code) == 1;

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

export default function inputHTML(options = {}) {
	let bundleHTML = {};
	return {
		name: "input-html",
		transform(code, id) {
			if (!isHTML(id)) return;

			bundleHTML[id] = bundleHTML[id] || {};
			if (bundleHTML[id].input !== code) {
				bundleHTML[id].input = code;

				let scripts = [];
				let document = patch([].concat(html.parse(code)), scripts)
					.map(node => html.serialize(node))
					.join("");
				bundleHTML[id].code = scripts.join("");

				bundleHTML[id].output = document;
			}
			return {
				code: bundleHTML[id].code || ""
			};
		},
		generateBundle(opts, bundle) {
			for (let key in bundleHTML) {
				let document = bundleHTML[key];
				if (document.output) {
					let { base: fileName } = path.parse(key);
					bundle[fileName] = {
						fileName,
						isAsset: true,
						source: document.output.replace(
							`<!--${inject}-->`,
							() => {
								if (!document.code) return "";
								let src = `./${fileName.replace(
									/\.html$/,
									".js"
								)}`;
								return options.native
									? `<script type="module" src="${src}"></script>`
									: `
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
								`;
							}
						)
					};

					document.output = "";
				}
			}
		}
	};
}
