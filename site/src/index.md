---
title: EStack
description: Modern static site builder
linkTitle: Welcome
lang: en
variation:
    $ref: lang.yaml
category:
    - header
---

{{page.variation|log}}

EStack is a modern static site generator that has a perfectly synchronized stack of tools.

1. Development server.
2. Frontmatter.
3. Asset management: Estack resolves assets relative to import.
4. Rollup and Postcss:
5. Incremental processing, the EStack observer relates the asset dependencies between files, so it only reprocesses the files that change directly or indirectly.

## Minimalist CLI

```bash
## Development: Files are not written to disk
estack dev src/**/*.{html,md}
## Production: Files are written to disk
estack build src/**/*.{html,md} docs
```

## Template

Estack uses [Liquidjs](https://liquidjs.com/) to get assets from html and markdown `asset` files.

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
