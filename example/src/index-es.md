---
title: EStack todo en uno
description: Generador de sitios estaticos, servidor de desarrollo, bundle,  zero configuracion y más.
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

### Todo proyecto recurre a una gran cantidad de herramientas con configuracion individual solo para comenzar a desarrollar, Estack reduce ese numero de herramientas a solo una con zero configuracion, logrando sincronizando eficientemente: Servidor de desarrollo, generador de sitios estaticos incremental, bundle(Rollup) y manejador de assets.

## Implementacion

### Instalacion

```raw
npm install -D {{pkg.name}}
```

### ejemplo de directorio

```
+-src
  |- index.js
  |- index.css
  |- index.html

```

**src/index.html**

```html
<!DOCTYPE html>
<html>
    <head>
        <link rel="stylesheet" href="{{ 'index.css' | asset }}" />
    </head>
    <body>
        <script type="module" src="{{ 'index.js' | asset }}"></script>
    </body>
</html>
```

`{{ './src/app.js' | asset }}` asset es un filtro personalizado para liquidjs que permite capturar los assets de una pagina o mas paginas, los assets capturados son enviados a distintis proceso segun su tipo, este al ser de tipo JS sera enviado a Rollup.

```bash
npx estack src/index.html --dev
```

El flag --dev lanza un servidor de desarrollo que obserba los cambios de los assets o el HTML para recargar la pagina, **los documentos servidos no son escritos en Disco**.

Estack permite usar expreciones, para capturar y observar multiples archivos, eg:

```bash
# npx estack src/index.html --dev
npx estack src/**/*.html --dev
```

## Manejo de archivos

EStack permite los archivos en carpetas para asi abstraer el contenido que necesita la pagina, este contenido debe ser declarado por la pagina de forma relativa a su origen, estack luego resolvera los nombre de los assets hacheandolos para evitar coliciones de archivos.

```bash
+-src
  |- index.js
  |- index.css
  |- index.html
  +- client
     |- index.js
     |- index.css
     |- client.html

+-localhost:8000
  |-index.html
  |-client.html
  +-assets
    |-123-index.js
    |-123-index.css
    |-234-index.js
    |-234-index.css
```

La distribucion de carpeta asociada a la extraccio de los archivos procesar por EStack no impera al momento de crear el documento HTML. para evitar esto EStack añade frontmatter, que permite modificar el comportamiento de la pagina, ej:

```html
---
title: Mi pagina
link: mi-carpeta/mi-pagina
---

<h1>{{page.title}}</h1>
```

la pagina del ejemplo seria indexada por el servidor de desarrollo como: `localhost:8000/mi-carpeta/mi-pagina`.
