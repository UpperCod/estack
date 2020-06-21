![EStack](../brand/header.svg)

**EStack simplifica desarrollo de sitios web estáticos y distribución de módulos ES**, con EStack tu podrás:

1. **Crear sitios estático**: EStack procesara sus archivos Html y Markdown para la extracción para la detección de assets y manejo de plantilla.
2. **Empaquetador de css**: EStack procesa los ficheros css con [Stylis](https://stylis.js.org/) una alternativa moderna, ligera y rápida a Postcss.
3. **Empaquetador de módulos ES**: EStack procesa los ficheros tipo JavaScript y TypeScript gracias a Rollup.
4. **Servidor de desarrollo**: EStack crea un servidor de desarrollo al momento de trabajar con el flag `--server`, que combinado con el flag `--watch`, activaran el modo livereload.
5. **Condicionar exportaciones**: EStack cuenta con diversos flag que permiten una exportación condicional, sea incluir archivos externos de NPM , minificar y más.
6. **Exportar usando expresiones**: EStack leerá los ficheros mediante expresiones, ejemplo la expresión `src/**/*.{html,markdown}` configurara a EStack para procesar todos los ficheros html y markdown existentes en el directorio `src/`.

## CLI

### Configuración

```
estack [src] [dest]
```

Donde:

- `src` : Directorio de origen de assets, tu puede apuntar a uno o múltiples ficheros, sea de forma directa o mediante expresiones.
- `dest` : Destino de los archivos procesados.

### Flags

`--watch` : Reinicia el proceso de build solo a los archivos afectados, este puede combinarse con `--server`, para activar el modo livereload del servidor creado por `EStack`.

`--server` : Crea un servidor local que apunta a `dest`.

`--port <number>` : `Default 8000`, define el puerto de búsqueda para el servidor.

`--proxy <url>` : Todo request no resuelto de forma local será enviado al proxy.

`--sourcemap` : Habilita la generación los archivos `js.map` de los assets tipo JavaScript.

`--minify` : Minifica los archivos JavaScript.

`--jsx <string> --jsxFragment <string>` : Default `h` y `Fragment`, permite customizar el soporte a JSX.

`--sizes` : Enseña por consola el tamaño de los archivos total, Gzip y Brotli tipo JavaScript.

## ¿Como crear sitios estáticos?

la gestión de sitios estáticos se activa al definir en la expresión de entrada(`src`), archivos de extensión `html` o `md`, ej:

```bash
estack src/**/*.html public # procesa solo los archivos .html y
                            # todos los assets que estos demanden
                            # los archivos procesados se almacenan en public

estack src/**/*.{html,md} public # procesa los archivos con extension
                                 # html y md , con todos los assets que estos demanden
                                 # los archivos procesados se almacenan en public
```

### Resolución de assets

La recolección de assets de los ficheros Html y Markdown se realiza mediante la expresión de CSS `[src]` o `[href]`, ej:

**index.html**

```html
<link rel="stylesheet" href="mi-css.css" />

<h1>mi documento html</h1>

<img src="mi-imagen.jpg" />

<script type="module" src="mi-pagina.js"></script>
```

**dest/index.html**: Esta salida del Html es un aproximado a lo real.

```html
<link rel="stylesheet" href="./mi-css.css" />

<h1>mi documento html</h1>

<img src="file-72123.jpg" />

<script type="module" src="./mi-pagina.js"></script>
```

> De no resolverse un asset de forma local, se mantendrá la URL de origen.

### Sistema de plantilla

EStack permite poseer un sistema de plantillas simple y escalable basado en Markdown, [Liquidjs](https://liquidjs.com/) y fragmentos de metadata de cabecera en formato YAML, eg:

**index.html**

```html
---
title: my page
---

<html>
  <head>
    <title>{{page.title}}</title>
  </head>
</html>
```

**index.md**

```markdown
---
title: my page
---

## {{page.title}}
```

> la propiedad `page` permite el acceso a todo lo declarado en el fragmento de metadatos.

### Regla de escritura

**Los assets exportados deben poseer nombre único**, ej:

**Directorio de entrada**.

```bash
/src
  /components
    /my-componet-1
      my-component-1.js
      my-component-1.md
    /my-componet-2
      my-component-2.js
      my-component-2.md
  index.html
  blog.html
```

Si ud ejecuta el comando `npx estack src/**/*.{html,md} dest`, data un resultado aproximado de:

```bash
/dest
  my-component-1.js
  my-component-2.js
  my-component-1.html
  my-component-2.html
  index.html
  blog.html
```

> Para personalizar el nombre o directorio de destino del directorio existe las propiedades especiales de metadata `folder` y `name`.

### Propiedades especiales de metadata

#### folder y name

La propiedad `folder` permite definir la carpeta de destino para el documento que la declara y la propiedad `name` permite definir el nombre del documento, ej:

```yaml
folder: animales
name: gato
```

Si su fichero se llama `my-cat.html`, este se escribirá en el destino como `animales/gato.html`, **La propiedad `name` se puede usar para referenciar entre paginas**

#### template

Permite definir el documento como plantilla maestra, por lo que no será escrito. ej:

**template.html**

```html
---
title: i am layout
template: default
---

<h1>{{layout.title}}</h1>
<h1>{{page.title}}</h1>

<div>
  {{page.content}}
</div>
```

> La propiedad default define este template como por defecto para todas las paginas que no declaren su layout.

**page.html**

```html
---
title: i am page
---

<p>lorem...</p>
```

**dest/page.html**

```html
<h1>i am layout</h1>
<h1>i am page</h1>
<div>
  <p>lorem...</p>
</div>
```

**Nota:** La propiedad template pude ser un alias distinto de default, eg:

```yaml
layout: template-users
```

#### pages

**Esta propiedad solo puede ser accedida por los template** y permite acceder a todas las paginas procesadas, sea metadata y contenido, eg:

```html
---
template: default
singlePage: index
---

<h1>links de pagina</h1>

{% for item in pages %}
<a href="{{item.link}}">
  {{item.title}}
</a>
{% endfor %}
```

#### pkg

Permite acceder a toda la data contenida en el package.json, ej:

### files

Permite generar un alias de importación como variable de la pagina, ej:

```markdown
---
files:
cover: ./my-image.jpg
---

## image

![image]({{files.cover}})
```

**La ventaja de esto es que el assets queda almacenado en la metadata para que pueda ser para ser usado**

### fetch

Permite generar un request al momento al momento de la build, eg:

```html
---
fetch:
config: ./config.yaml
todos: https://jsonplaceholder.typicode.com/todos
---

<h1>{{fetch.config.title}}</h1>

{% for todo in todos %}

<div>
  <h3>{{todo.title}}</h3>
</div>
{% endfor %}
```

**Fetch** crea una relación de dependencia con los ficheros locales, por lo que cualquier cambio genera una rescritura del documento que lo utiliza.

## Assets tipo CSS

Los fichero css pueden ser usados como módulos dentro de Rollup o como Assets de fichero Html o Markdow, estos son procesados gracias a [Stylis](https://stylis.js.org/).

### @import

la configuración permite importar módulos locales o desde node_modules, la resolución de este debe ser apuntado hacia el fichero ej:

```css
@import "./my-css.css"; /**local**/
@import "my-package/my-css.css"; /**node_module**/
```

### @use

Este permite aplicar una selección sobre los selectores y keyframes importados por el css, ej:

```css
@use ".button-circle";
@import "my-package-1/my-buttons";
@import "my-package-2/my-buttons";

.button-circle {
  color: black;
}
```

Todo selector distinto de `.button-circle` será ignorado en la exportación desde `my-package-1/my-buttons` y `my-package-2/my-buttons`.

**la utilidad de @use** es eliminar el css que no cumpla con la expresión.

Tipos de expresiones para @use:

- `@use ".button"` : Todo selector que inicie con `.button`
- `@use ".button-"` : Todo selector que inicie con `.button-`, ej: `.button-circle` y `button-alert`
- `@use "button$"` : Solo el selector `button`

### Módulos css

Ud podrá exportar el css como texto plano para ser usado dentro de javacsript, eg:

```js
import style from "./my-css.css";
```

Útil para trabajar con webcomponents, ya que el css se entrega mitificado, ideal para su uso dentro del shadowDom.

## Liquidjs

### Filtros

#### order

```
{{ myList | order : "my.field" }}
```

Este ordena una lista a base del indice asociado al objeto dentro de esta.

#### group

```liquid
{{ myList | group : "tag" }}
```

Permite agrupar objetos en listas según el índice dado

#### markdown

```liquid
{{ myString | markdown }}
```

Aplica el transformador de markdown

#### highlighted

```liquid
{{ myCode | highlighted : "js" }}
```

Aplica el transformador de [Primsjs](https://prismjs.com/)

#### find

```liquid
{{ myCode | find : "tag", "case" }}
```

### Tags

**fragment.html** : EStack detecta los fragmentos gracias a la propiedad `fragment`.

```html
---
title: default title
fragment: header # Ahora puede usar este fragmento dentro del sitio solo declarando el nombre
---

<header>
  <h1>{{title}}</h1>
</header>
```

**Ejemplo**

```html
{% fragment "header" %}
<!--output-->
<header>
  <h1>default title</h1>
</header>

{% fragment "header" with title : "custom title" %}
<!--output-->
<header>
  <h1>custom title</h1>
</header>
```

Este tag permite reutilizar bloques de codigo, estos bloques no conoceran solo su contexto y el de asignación.
