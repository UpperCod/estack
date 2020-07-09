---
title: EStack "{}"
description: En entorno productivo basado en una pila de herramientas perfectamente sincornizadas
linkTitle: Introduccion
link: /
symlink: index-es
lang: es
tag: doc
order: -1
assets:
    logo: ./logo.svg
aside:
    title: EStack
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
fetch:
    todo: https://jsonplaceholder.typicode.com/todos
---

<script src="{{ 'index.js' | asset }}"></script>

## go [{{page.title}}]({{page.link}})

Todo desarrollo web require un gran grupo de herramientas solo para comenzar a crear,

Lograr una configuracion eficiente y escalable es un tema complejo que EStack busca solucionar, respondiendo a objetivos esenciales.

Elejir, configurar y escalar estas herramientas es un tema complejo, pero todas conberjen en las mismas necesidades.
Empaquetar Javascrit, Procesar Html y Manejar assets

elejir una o muchas de estas herramientas esta sugeto, EStack busca agrupar estas herramientas y vincularlas en un entorno perfectamente sincronizado con zero-congiguracion para una web moderna.

1. Un Servidor de desarrollo con livereload que peude exporner uno o mas dodumentos html.

## Comenzando

### Instalacion

```raw
npm install -D {{pkg.name}}
```

### Crear un documento html

```html
<!DOCTYPE html>
<html>
    <head></head>
    <body>
        <!--
    <script type="module" src="./src/app.js"></script>
    -->
        <script type="module" src="{{ './src/app.js' | asset }}"></script>
    </body>
</html>
```

Donde :

1. `{{ './src/app.js' | asset }}` : EStack sincroniza la captura de asset usando liquidjs, lo enseñado es solo una parte de las utilidades que posee la importacion inteligente de asset de EStack.

```bash
npx estack index.html --dev
```
