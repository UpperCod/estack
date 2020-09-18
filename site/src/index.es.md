---
title: EStack
link: es/estack
description: Generador de sitios estáticos moderno
linkTitle: Welcome
category:
    - header
---

EStack es un generador de sitios estáticos moderno que posee un stack de herramientas perfectamente sincronizadas.

1. Servidor de desarrollo.
2. Frontmatter.
3. Gestión assets: Estack resuelve los assets de forma relativa a la importación.
4. Rollup y Postcss:
5. Procesamiento incremental, el observador de EStack relaciona las dependencias de assets entre archivos, por lo que solo reprocesa los archivos que cambian directa o indirectamente.

## CLI minimalista

```bash
## Desarrollo
estack dev src/**/*.{html,md}
## Producción
estack build src/**/*.{html,md} docs
```

## Template

Estack usa [Liquidjs](https://liquidjs.com/) para lograr capturar assets desde la plantilla mediante el uso del tag `asset`.

```html
---
title: My page
lang: es
category:
    - header
---

<h1>{{page.title}}</h1>
<img src="{{'logo.svg'|asset}}" />
<link rel="stylesheet" href="{{'index.css'|asset}}" />
<script src="{{'index.js'|asset}}" type="module"></script>
```
