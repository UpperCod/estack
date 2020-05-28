# bundle-cli

Bundle-cli offers a dynamic environment for developing and packaging JavaScript, Css and Html, inspired by [Parceljs](https://parceljs.org/).

## With this CLI you can:

### Define multiple types of input inputs based on expressions.

Bundle-cli is capable of parsing different types of files based on expressions, such as `html`,`markdown`, `javascript`,`typescript` and `css` files.

If its source is of the html or markdown type, bundle will export the assets of these files, based on the `[href]` or `[src]` selector, eg: `<script src =" my-js.js "> < / script>`or`<img src = "my-image.jpg">`

### Efficient file watcher

The bundle-cli development mode(`--watch`) detects changes based on the creation, modification and deletion of files.

### Modern environment

Bundle-cli does not seek to be compatible with older browsers, it is intended for modern ESM-based development, optimized thanks to [Rollup](http://rollupjs.org/), [Sucrase](https://sucrase.io/) and other spectacular packages.

### Dynamic html and markdown documents

Create scalable sites or applications, maintain with a template system with [Liquidjs](https://liquidjs.com/) and allow each file to be html or markdwon can declare metadata fragments, eg:

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

## Processing of html and markdown documents

The template system allows the use of Markdown, [Liquids](https://liquidjs.com/) and metadata in yaml format.

### Example of page

```markdown
---
title: my page
---

## {{page.title}}

More content...

<my-element></my-element>

<script type="module" src="my-element.js"></script>.
```

> the `page` property allows access to everything declared in the metadata fragment.

### Writing rule

**Ungrouped inputs are html or markdow and javascript assets must have a unique name**, ej:

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

Writing these files does not preserve the source path, eg:

```bash
/dest
  my-component-1.js
  my-component-2.js
  my-component-1.html
  my-component-2.html
```

To modify the destination there are special metadata properties `folder` and`name`.

### Special metadata properties

#### folder

This property allows defining the destination folder for the document that declares it.

```yaml
folder: gallery
```

If your file is called `cat.html`, it will be written to the destination as `gallery/cat.html`.

#### template

It allows defining the document as a master template, so it will not be written. eg:

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

> The default property defines this template as the default for all pages that do not declare their layout.

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

**Note:** The template property can be an alias other than `default`, eg:

```yaml
layout: template-users
```

#### pages

**This property can only be accessed by templates** and allows access to all pages processed, be it metadata and content, eg:

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

It allows access to all the data contained in the package.json, ex:

**my-element.md**

````markdown
## Usage

​```js
import "{{pkg.name}}/my-element.js";

```

```
````

**dest/my-element.html**

​```html

<h1>
  Usage
</h1>
<pre><code>import "my-package/my-element.js";</code></pre>
```

### files

It allows to generate an import alias as a page variable, eg:

```markdown
---
files:
  cover: ./my-image.jpg
---

## image

![my image]({{files.cover}})
```

**The advantage of this is that the assets are stored in the metadata so that it can be used**

### fetch

It allows to generate a request at the moment at the moment of the build, eg:

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

**Fetch** creates a dependency relationship with local files, so any change generates a rewriting of the document that uses it.

## CSS type Assets

The css files can be used as modules within Rollup or as Html or Markdow file Assets, these are processed thanks to the power of [Stylis](https://stylis.js.org/).

### @import

the configuration allows importing local modules or from node_modules, the resolution of this must be pointed to the file eg:

```css
@import "./my-css.css"; /**local**/
@import "my-package/my-css.css"; /**node_module**/
```

### @use

This allows applying a selection on the selectors and keyframes imported by the css, eg:

```css
@use ".button-circle";
@use "keyframe mi-animation";
@import "my-package-1/my-buttons";
@import "my-package-2/my-buttons";

.button-circle {
  color: black;
}
```

Any selector other than `.button-circle` will be ignored in the export from `my-package-1/my-buttons` and `my-package-2/my-buttons`.

Example of expressions:

- `@use ".button"` : Any selector that starts with `.button`.
- `@use ".button-"` : Any selector that starts with `.button-`, eg: `.button-circle` and`button-alert`.
- `@use "button$"` : Only the `button` selector

### CSS modules

You can export the css as plain text to be used within javacsript, eg:

```js
import style from "./my-css.css";
```

**Useful to work with webcomponents**, since the css is delivered mythified, ideal for use within the shadowDom

## Cli

Know all the documentation of the cli using `npx bundle --help`, detailed information on this cli is detailed below.

### --server

create a server, by default the port search initializes from the number `8000`, you can change this behavior using the`--port` flag.

#### --proxy

Enable the use of proxy on the server, this thanks to [http-proxy-middleware] (# http-proxy-middleware)
This flag only works when using the `--server` flag. It allows directing all requests that are not resolved locally to an external one, eg:

```
--proxy https://jsonplaceholder.typicode.com
```

```js
fetch("/todos")
  .then(res => res.json())
  .then(data => {
    console.log(data); //[...]
  });
```

#### --watch

Enables development mode, using in conjunction with the `--server` flag initializes livereload mode

#### --minify

Enable the use of Terser for Rollup outgoing files, this will minify the JS code, `in the future it is planned to compress html`.
