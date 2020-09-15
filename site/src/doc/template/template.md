---
title: Template
lang: en
category:
    - header
description: Sincronización perfecta entre Liquidjs y Estack
---

Stack obtains assets declared in HTML and Markdown documents thanks to [Liquidjs](https://liquidjs.com/) a minimalist and easily extensible template engine.

## Context

Render data is the data context to LiquidJs for rendering HTML and Markdown files.

```ts
import { File } from "estack";

export interface Page extends Omit<File, "data"> {
    data: PageData;
}

export interface Pages {
    [link: string]: Page;
}

export interface PageData {
    id: string;
    link?: string;
    lang?: string;
    category?: string[];
    fragment?: string;
    template?: string;
    layout?: string;
    global?: string;
    content?: string;
}

export interface RenderData {
    file: Page;
    page: PageData;
    category: Categories;
    layout: PageData;
    content: string;
    global: Globals;
}
```

## Filters

### asset

It allows to obtain the assets, these assets will be processed according to the type, the Html and Markdown files should not be captured using this filter.

```html
<img src="{{'logo.svg'|asset}}" />
<!--
💬 The assets of extension .css will be processed through PostCss
-->
<link rel="stylesheet" href="{{'index.css'|asset}}" />
<!--
💬 The assets of extension .js | .jsx | .ts | .tsx will be processed by Rollup
-->
<script src="{{'index.js'|asset}}" type="module"></script>
```

### query

It allows querying the `category` object, example:

```html
{% assign header = category|query: operator:"and", select: "header", select :
page.lang] %}
```

the properties you can use for the query are:

```yaml
# Category name
- select: string
# "and": Forces all pages to have the selected categories
# "or" : The selected pages can have one of the listed categories.
- operator: and | or
# Limite de resultados
- limit: number
# Index to use to sort the results
- sort: string
# Indicates if the order is besieging or descending
- order: -1 | 1
```
