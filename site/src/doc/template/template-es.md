---
title: Template
link: es/template
lang: es
category:
    - header
description: Sincronización perfecta entre Liquidjs y Estack
---

EStack captura los assets declarados en los documentos HTML y Markdown gracias a Liquidjs un motor de plantilla minimalista y fasilmente extendible.

## RenderData

Render data es el contexto de data dato a LiquidJs para el procesamiento de los archivos HTML y Markdown.

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

## Filtros

### asset

Permite la captura de assets, estos assets seran procesados segun el tipo, los archivos tipo Html y Markdown no debe nser capturados medainte este filtro, para estos casos perfiera el uso de \$link en el frontmatter, ejemplo:

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

### query

Permite realizar query sobre el objeto `category`, ejemplo:

```html
{% assign header = category|query: operator:"and", select: "header", select :
page.lang] %}
```

las propiedades que puede usar para la query son:

```yaml
# nombre de la categoría
- select: string
# "and": Obliga a que todas pas paginas posean las categorias selecionadas
# "or" : Las paginas selcionadas peuden poseer una de las categorias seecioadas.
- operator: and | or
# Límite de resultados
- limit: number
# indice a usar para ordenar los resultados
- sort: string
# Indica si el orden es asediante o descendente
- order: -1 | 1
```
