---
title: Template
order: 4
category: aside
description: Sincronización perfecta entre Liquidjs y Estack
---

EStack captures assets declared in HTML and Markdown documents thanks to Liquidjs, a minimalist and easily extensible template engine.

## Filters

### asset

It allows the capture of assets from the template, **remember the resolution of the asset is relative to the file**.

```html
<img src="{{'logo.svg'|asset}}" />
<!--
💬 The assets of extension .css will be processed through PostCss.
-->
<link rel="stylesheet" href="{{'index.css'|asset}}" />
<!--
💬 The assets of extension .js | .jsx | .ts | .tsx will be processed by Rollup
-->
<script src="{{'index.js'|asset}}" type="module"></script>
```

### order

Similar to [sort](https://liquidjs.com/filters/sort.html), with the difference that it accepts a second argument that defines:

1. `1`: Ascending order.
2. `-1`: Descending order.

### select

It allows selecting an object type `Object <string, any []>`, the indexes will be grouped in an array, example:

```html
{% assign data = category | select: "category-1", "category-2" %}
```

### limit

Define the maximum size of the array, example:

```html
{% assign data = category.data | limit: 10 %}
```

### log

Show the filter argument in console, example:

```html
{{page|log}}
```

## Tags

### fragment

Pages declared as fragment in the frontmatter can be retrieved using this fragment tag, example:

```html
{% fragment "myFragment" with title: "...." %}
```

** The data declared in the tag will replace the default data declared in the fragment's frontmatter **.

## Context

Render data is the data context to LiquidJs for rendering HTML and Markdown files.

```ts
import { File, Site } from "estack";

export interface Page extends Omit<File, "data"> {
    data: PageData;
}

export interface Pages {
    [link: string]: Page;
}

export interface PageData {
    id?: string;
    link?: string;
    file?: string;
    lang?: string;
    langs?: Langs;
    category?: string[];
    fragment?: string;
    template?: string;
    layout?: string;
    content?: string;
    date?: string;
    parentLang?: string;
}

export interface RenderData {
    file: Page;
    page: PageData;
    category: Categories;
    layout: PageData;
    content: string;
    site: Site;
}

export interface RenderDataFragment {
    file: Page;
}

export interface Categories {
    [category: string]: PageData[];
}

export interface Langs {
    [lang: string]: PageData;
}

export interface ParentLangs {
    [parent: string]: Langs;
}
```
