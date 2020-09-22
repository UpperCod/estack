---
title: Plugins
order: 3
description: Herramientas externas perfectamente sincronizadas
linkTitle: Plugins
category: aside
---

La configuración adicional a asociar a EStack debe existir en el package.json, tu podrá asociar configuraciones de forma selectiva según script.

## Rollup

EStack usa [Rollup](https://rollupjs.org/guide/en/) para el prosamiento de archivos de extension `.js, .jsx, .ts, .tsx`.

### Añadiendo plugins para rollup

Estack permite inyectar plugins a Rollup, mediante el flag `--js <pkg_property>`, ejemplo:

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

EStack usa [Postcss](http://postcss.org/) para el prosamiento de archivos de extension `.css`, por defecto EStack para postcss:

1. Plugin [@uppercod/postcss-import](https://github.com/UpperCod/postcss-import).

### Añadiendo plugins para postcss

Estack permite inyectar plugins a Postcss, mediante el flag `--css <pkg_property>`, ejemplo:

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
