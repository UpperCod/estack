---
title: EStack cree sitios estaticos a la velosidad de la luz
description: una sola herramienta <strong>zero-configuracion</strong> para sincronziación de datos, sistema de plantilla y gestión de assets de forma inteligente.
menu: Introduccion
slug: index
symlink: index-es
lang: es
tag: doc
order: -1
assets:
  logo: ./logo.svg
aside:
  title: My Desing System
  install: npm install my-ds
  description: |
    nulla Lorem officia et ea anim 
    aute commodo deserunt
  links:
    - prop: docs
      title: Documentacion
query:
  docs:
    where:
      lang: es
      tag: doc
    sort: order
    order: 1
---

Si bien un sitio o aplicación puede comenzar desde un simple grupo de Ficheros HTML, CSS y JS enfrentaremos grandes preguntas al momento de escalarlo de forma estática ¿Como seccionarlo? ¿Como hacerlo multilenguaje? ¿ Como gestionar assets ? ¿Como hacerlo dinámico? **EStack responde a estas preguntas entregando en una sola herramienta sincronziación de datos, sistema de plantilla y gestión de assets.**

### Con EStack podras:

{% raw %}

<easy-doc-rows columns="1fr 1fr">

```html
---
title: my page
---
<h1>{{page.title}}</h1>

<img src="{{ "image.jpg" | asset }}" />

<a href="{{page.link}}">{{page.link}}</a>

<script type="module" src="{{ "index.ts" | asset}}"></script>
```

```html
<h1>my page</h1>

<img src="/2123-image.jpg" />

<a href="/">/</a>

<script type="module" src="index.js"></script>
```

</easy-doc-rows>

{% endraw %}
