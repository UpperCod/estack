# Estack

Estack busca mejorar la experiencia de desarrollo para webcomponents, ofreciendo un entorno dinámico para desarrollar y empaquetar JavaScript, Css y Html, inspirado en [Parceljs](https://parceljs.org/).

## Con este CLI ud podrá:

### Múltiples tipos de inputs de entrada.

Estack es capas de analizar distintos tipo de fichero a base de expreciones, estos pueden ser del tipo `html`,`markdown`, `javascript`,`typescript` y `css`.

Si su origen es del tipo html o markdown, bundle exportara los assets de proyecto, si estos cumplen con el selector `[href]` o `[src]`, eg: `<script src="my-js.js"></script>` o `<img src="my-image.jpg">`

### Observador de cambios inteligente y rápido.

EL modo de desarrollo(`--watch`) de Estack es rápido, ya que solo resuelve los ficheros que realmente han cambiado a base de sus relaciones y demanda, esto con el objetivo de minimizar los tiempos de escritura al usar el flag `--watch`.

### Entorno moderno

Estack no busca ser compatible con navegadores antiguos, esta pensado para un desarrollo moderno a base de ESM, optimizado gracias a [Rollup](http://rollupjs.org/), [Sucrase](https://sucrase.io/) y otros espectaculares packages.

### Documentos dinámicos html y markdown

Cree sitios o aplicaciones escalables, mantenerle con un sistema de plantillas a base de liquidjs y permite que cada fichero sea html o markdwon puedan declarar fragmentos de metadata ,ej:

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

> la propiedad `page` permite el acceso a todo lo declarado en el fragmento de metadatos.

## Procesamiento de documentos html y markdown

El sistema de plantillas permite el uso de Markdown, [Liquidjs](https://liquidjs.com/) y metadata en formato yaml.

### Ejemplo de pagina

```markdown
---
title: my page
---

## {{page.title}}

More content...

<my-element></my-element>

<script type="module" src="my-element.js"></script>.
```

### Regla de escritura

**Los inputs no agrupados sea html o markdow y los assets tipo javascript deben poseer nombre único**, ej:

```bash
/src
  /components
    /my-componet-1
      my-component-1.js
      my-component-1.md
    /my-componet-2
      my-component-2.js
      my-component-2.md
```

La escritura de estos archivos no conserva la ruta de origen, ej:

```bash
/dest
  my-component-1.js
  my-component-2.js
  my-component-1.html
  my-component-2.html
```

Para modificar el destino existe las propiedades especiales de metadata `folder` y `name`.

### Propiedades especiales de metadata

#### folder

Esta propiedad permite definir la carpeta de destino para el documento que la declara

```yaml
folder: gallery
```

Si su fichero se llama `cat.html`, este se escribirá en el destino como `gallery/cat.html`.

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

##### pkg

Permite acceder a toda la data contenida en el package.json, ej:

**my-element.md**

````markdown
## Usage

​```js
import "{{pkg.name}}/my-element.js";

```

```
````

**dest/my-element.html**

```html
<h1>
  Usage
</h1>
<pre><code>import "my-package/my-element.js";</code></pre>
```

### files

Permite generar un alias de importación como variable de la pagina, ej:

## ​```markdown

files:
cover: ./my-image.jpg

---

## image

![my image]({{files.cover}})

````

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
````

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

**Util para trabajar con webcomponents**, ya que el css se entrega mitificado, ideal para su uso dentro del shadowDom

## Cli

Conozca toda la documentación del cli mediante `npx bundle --help`, a continuación se detallan las mas importantes:

### --server

Activa un servidor, por default la busqueda de puerto inicializa desde le numero `8000`, ud puede cambiar este comportamiento mediante el flag `--port`

#### --proxy

Habilita el uso de proxy sobre el servidor, esto gracias a [http-proxy-middleware](#http-proxy-middleware)
Este flag solo trabaja al momento de usar el flag `--server`
Permite direcionar toda request que no se resuelva de forma local a una externa, eg:

```
--proxy https://jsonplaceholder.typicode.com
```

```js
fetch("/todos")
  .then((res) => res.json())
  .then((data) => {
    console.log(data); //[...]
  });
```

#### --watch

Habilita el modo desarrollo, al usar junto con el flag `--server` se inicializa el modo livereload

#### --minify

Habilita el uso de Terser para los archivos salientes de Rollup, esto minificara el código JS
