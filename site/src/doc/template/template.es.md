---
title: Template
order: 4
category: aside
description: Sincronización perfecta entre Liquidjs y Estack
---

EStack captura los assets declarados en los documentos HTML y Markdown gracias a Liquidjs un motor de plantilla minimalista y fácilmente extensible.

## Filtros

### asset

Permite la captura de assets desde la plantilla, **recuerde la resolución del asset es relativa al archivo**.

```html
<img src="{{'logo.svg'|asset}}" />
<!--
💬 Los assets de extension .css seran procesados mediante PostCss
-->
<link rel="stylesheet" href="{{'index.css'|asset}}" />
<!--
💬 Los assets de extension .js|.jsx|.ts|.tsx seran procesados mediante Rollup
-->
<script src="{{'index.js'|asset}}" type="module"></script>
```

### order

Similar a [sort](https://liquidjs.com/filters/sort.html), con la diferencia de que este acepta un segundo argumento que define:

1. `1`: orden ascendente.
2. `-1`: orden descendente.

### select

Permite seleccionar de un objeto tipo `Object<string,any[]>`, los índices serán agruparlos en un array, ejemplo:

```html
{% assign data = category | select: "category-1", "category-2" %}
```

### limit

Define el tamaño máximo del arreglo, ejemplo:

```html
{% assign data = category.data | limit: 10 %}
```

### log

Enseña el argumento del filtro en consola, ejemplo:

```html
{{page|log}}
```

## Tags

### fragment

Las paginas declaradas como fragmento en el frontmatter pueden ser recuperadas mediante este tag fragment, ejemplo:

```html
{% fragment "myFragment" with title: "...." %}
```

**La data declarada en el tag remplazara la data por defecto declarado en el frontmatter del fragmento**.

## Contexto

Render data es el contexto de data dato a LiquidJs para el procesamiento de los archivos HTML y Markdown.

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
