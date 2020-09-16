---
title: Plugins
description: Herramientas externas perfectamente sincronizadas
linkTitle: Plugins
lang: en
category:
    - header
---

The additional configuration to associate with EStack must exist in the package.json, you can selectively associate configurations according to your objectives.

## Rollup

Stack uses [Rollup](https://rollupjs.org/guide/en/) for processing files with the extension `.js, .jsx, .ts, .tsx`.

### Adding plugins for rollup

EStack allows to inject plugins into Rollup, using the `--js <pkg_property>` flag, example:

```json
{
    "scripts": {
        "dev": "estack dev src/**/*.html --js estack.dev.js",
        "build": "estack build src/**/*.html public --js estack.build.js"
    },
    "estack": {
        "dev": {
            "js": {
                "plugins": {
                    "@rollup/plugin-typescript": {
                        "tsconfig": "tsconfig.json"
                    }
                }
            }
        },
        "build": {
            "js": {
                "plugins": {
                    "@rollup/plugin-typescript": {
                        "tsconfig": "tsconfig.json"
                    },
                    "rollup-plugin-terser": {}
                }
            }
        }
    }
}
```

## Postcss

EStack uses [Postcss](http://postcss.org/) for processing files with the extension `.css`, by default EStack for postcss:

1. Plugin [@uppercod/postcss-import](https://github.com/UpperCod/postcss-import).

### Adding plugins for postcss

Estack allows you to inject plugins into Postcss, using the `--css <pkg_property>` flag, example:

```json
{
    "scripts": {
        "dev": "estack dev src/**/*.html --css estack.dev.css",
        "build": "estack build src/**/*.html public --css estack.build.css"
    },
    "estack": {
        "dev": {
            "css": {
                "plugins": {
                    "postcss-preset-env": {}
                }
            }
        },
        "build": {
            "css": {
                "plugins": {
                    "postcss-preset-env": {},
                    "cssnano": {}
                }
            }
        }
    }
}
```
