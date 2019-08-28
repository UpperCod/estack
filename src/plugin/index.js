import path from "path";

import match from "picomatch";
import html from "parse5";

import postcss from "postcss";
import postcssPresetEnv from "postcss-preset-env";
import cssnano from "cssnano";
import atImport from "postcss-import";

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
	return {
		name: "bundle",
		async transform(code, id) {
			let { isEntry } = this.getModuleInfo(id);
			if (isCSS(id)) {
				let { name, dir } = path.parse(id);
				let { css } = code.trim()
					? await postcss([
							atImport({
								resolve: file => {
									let id = path.join(
										/^\./.test(file)
											? dir
											: path.join(cwd, "node_modules"),
										file
									);
									// Add an id to bundle.watchFile
									this.addWatchFile(id);
									return id;
								}
							}),
							postcssPresetEnv({
								stage: 0,
								browsers: options.browsers
							}),
							...(options.watch ? [] : [cssnano()])
					  ]).process(code)
					: "";

				if (isEntry) {
					let fileName = name + ".css";
					this.emitFile({
						type: "asset",
						name: fileName,
						fileName,
						source: css
					});
				}
				return {
					code: isEntry ? "" : "export default  `" + css + "`;",
					map: { mappings: "" }
				};
			}

			if (isHTML(id) && isEntry) {
				let { name } = path.parse(id);
				let fileName = name + ".html";
				let scripts = [];

				let document = patch([].concat(html.parse(code)), scripts)
					.map(node => html.serialize(node))
					.join("");

				let script =
					scripts
						.map(src => `import ${JSON.stringify(src)}`)
						.join(";") || "";

				let src = `${fileName.replace(/\.html$/, ".js")}`;

				this.emitFile({
					type: "asset",
					name: fileName,
					fileName,
					source: document.replace(`<!--${inject}-->`, () => {
						if (!script) return "";

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
									shimport('./${src}');
									</script>
									`
							: `<script type="module" src="./${src}"></script>`;
					})
				});

				bundleHTML[src] = script;

				return {
					code: script,
					map: { mappings: "" }
				};
			}
		},
		generateBundle(opts, bundle) {
			for (let key in bundle) {
				let { isEntry, facadeModuleId, fileName } = bundle[key];
				if (
					isEntry &&
					(isCSS(facadeModuleId) ||
						(fileName in bundleHTML && !bundleHTML[fileName]))
				) {
					delete bundle[key];
				}
			}
		}
	};
}
