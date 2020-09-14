---
title: EStack
description: Generator de sitios estaticos moderno
linkTitle: Welcome
lang: es
category:
    - header
---

EStack es un generador de sitios estaticos moderno que posee un stack de herramientas perfectamente sincronizadas.

1. Servidor de desarrollo
2. Frontmatter
3. Gestion assets: Estack resuvle los assets de forma relativa a la importacion y hacea sus nombres para evitar conficto si estos se imrpotan desde una fuente tipo HTML o Markdown.
4. Rollup y Postcss:
5. Procesamiento incremental, el obsevador de EStack, relaciona las depedenciias de assets entre archivos, por lo que reprocesa solo los archivos que cambian directa o indirectamente.

## CLI minimalista

```bash
## Desarrollo
estack dev src/**/*.{html,md}
## Producción
estack build src/**/*.{html,md} docs
```

## Template

Estack usa Liquid y sincronzia la build directamente con este, para lograr capturar assets desde la plantilla mediante el uso del tag `asset`

```html
---
title: My page
lang: es
category:
    - header
---

<!--html-->
<h1>{{page.title}}</h1>
<img src="{{'logo.svg'|asset}}" />
<link rel="stylesheet" href="{{'index.css'|asset}}" />
<script src="{{'index.js'|asset}}" type="module"></script>
```
