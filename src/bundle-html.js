import html from "parse5";
import { read, write } from "./utils";
import path from "path";

let ignore = ["#text", "#comment"];

export async function bundleHtml(file, dir) {
  let { base, dir: dirOrg } = path.parse(file);
  let content = await read(file);

  let fragment = [].concat(html.parse(content));
  let scripts = [];

  let document = patch(fragment, src => {
    scripts.push(path.join(dirOrg, src));
  })
    .map(fragment => html.serialize(fragment))
    .join("");

  await write(path.join(dir, base), document);
  return scripts;
}

function patch(fragment, addScript) {
  let length = fragment.length;
  for (let i = 0; i < length; i++) {
    let node = fragment[i];

    if (ignore.includes(node.nodeName)) continue;

    if (node.nodeName == "script") {
      if (
        node.attrs.some(
          ({ name, value }) => name == "type" && value == "module"
        )
      ) {
        node.attrs = node.attrs.map(({ name, value }) => {
          if (name == "src" && !/^(http(s){0,1}:){0,1}\/\//.test(value)) {
            addScript(value);
            value = path.parse(value).name + ".js";
          }
          return { name, value };
        });
      }
    } else {
      node.childNodes && patch(node.childNodes, addScript);
    }
  }
  return fragment;
}
