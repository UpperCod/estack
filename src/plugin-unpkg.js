import resolve from "resolve";
import { cwd } from "./utils";
import { join } from "path";

function getParts(id) {
  let [input, ...next] =
    id.replace(/^\//, "").match(/((?:@[^\/]+(?:\/)){0,1}[^\/]+)(.*)/) || [];
  return next;
}

export default function({ external, importmap }, indexExternals) {
  let fileName = "import-map.importmap";
  let imports = {};
  let pkgs = {};

  let isExternal = id => {
    if (/^(@|\w)/.test(id)) {
      let [root] = getParts(id);
      return indexExternals.some(index => index.indexOf(root) == 0);
    }
  };

  let resolveUnpkg = async id =>
    new Promise(scopeResolve => {
      let [root, child] = getParts(id);
      let [subRoot] = child ? getParts(child) : [];
      let file;
      let getFile = pkg => pkg.module || pkg.main || pkg.browser;
      resolve(
        id,
        {
          basedir: cwd,
          packageFilter(pkg, dir) {
            if (subRoot) {
              if (pkg.name == subRoot) {
                file = getFile(pkg);
                return pkg;
              }
            } else {
              if (pkg.name == root && !pkgs[root]) {
                pkgs[root] = pkg;
              }
              return pkg;
            }
          }
        },
        async err => {
          let md = file || getFile(pkgs[root]);
          let version = pkgs[root].version;

          let concat = subRoot ? (file ? "/" + subRoot + "/" + md : child) : md;

          if (!/\.js$/.test(concat)) {
            concat += ".js";
          }

          scopeResolve(
            `https://unpkg.com/${join(`${root}@${version}`, concat).replace(
              /\\/g,
              "/"
            )}?module`
          );
        }
      );
    });
  return {
    async resolveId(id, importer) {
      if (importer && isExternal(id) && (external == "unpkg" || importmap)) {
        if (!imports[id]) {
          imports[id] = await resolveUnpkg(id);
        }
        return {
          id: external == "unpkg" ? imports[id] : id,
          external: true
        };
      }
    },
    generateBundle(opts, bundle) {
      if (importmap) {
        bundle[fileName] = {
          fileName,
          isAsset: true,
          source: JSON.stringify({ imports })
        };
      }
    }
  };
}
