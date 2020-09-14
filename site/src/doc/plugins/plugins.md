---
title: Plugins
linkTitle: Plugins
lang: es
category:
    - header
---

## Añadiendo plugins para rollup

Estack permite inyectar plugins a rollup, mediante el flag `--js <pkg_property>`, ejemplo:

```json
{
    "scripts": {
        "dev": "estack dev src/**/*.html --js estack.dev.js",
        "build": "estack build src/**/*.html public --js estack.build.js"
    },
    "estack": {
        "dev": {
            "js": {
                "@rollup/plugin-typescript": {
                    "tsconfig": "tsconfig.json"
                }
            }
        },
        "build": {
            "js": {
                "@rollup/plugin-typescript": {
                    "tsconfig": "tsconfig.json"
                },
                "rollup-plugin-terser": {}
            }
        }
    }
}
```

## Añadiendo plugins para postcss

Estack permite inyectar plugins a Postcss, mediante el flag `--css <pkg_property>`, ejemplo:

```json
{
    "scripts": {
        "dev": "estack dev src/**/*.html --css estack.dev.js",
        "build": "estack build src/**/*.html public --css estack.build.cssx"
    },
    "estack": {
        "dev": {
            "css": {
                "postcss-preset-env": {}
            }
        },
        "build": {
            "css": {
                "postcss-preset-env": {},
                "cssnano": {}
            }
        }
    }
}
```

## Plugins personalizados

pronto...
