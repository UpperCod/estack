# bundle-cli

bundle-cli is created to minimize the impact of development on disk usage, its node_module will only contain rollup and bundle-cli packages after installation, **Bundle-cli aims to be a dynamic and friendly development environment for webcomponents, with this CLI you can:**

1. Export assets from html and markdown files created on the fly, an effect similar to ParselJs, but without the limitation of only one index.html, bundle-cli parses based on an expression so you can add files on the mark and automatically bundle-cli processes them.
2. Add html, markdowns and assets that are dynamically synchronized in watch mode for the regeneration of the bundle or browser reload.
3. Exports using expressions.
4. Server with livereload, synchronized to the regeneration of the bundle.
5. Minification and more.

### npx bundle --help

```
  Usage
    $ bundle [src] [dest] [options]

  Options
    --watch          Watch files in bundle and rebuild on changes  (default false)
    --external       Does not include dependencies in the bundle
    -c, --config     allows you to export a configuration from package.json
    --sourcemap      enable the use of sourcemap  (default true)
    --server         Create a server, by default localhost:8000  (default false)
    --port           define the server port  (default 8000)
    --proxy          redirect requests that are not resolved locally  (default false)
    --sizes          Displays the sizes of the files associated with rollup  (default false)
    --jsx            pragma jsx  (default h)
    --jsxFragment    pragma fragment jsx  (default Fragment)
    --minify         minify the code only if the flag --watch is not used  (default false)
    -v, --version    Displays current version
    -h, --help       Displays this message

  Examples
    $ bundle src/index.html public --watch --server
    $ bundle src/index.html public --external
    $ bundle src/index.html public --external react,react-dom
    $ bundle src/index.js dist --watch
    $ bundle src/*.js dist
    $ bundle src/*.{html,md}
    $ bundle
```

## html and markdown document management

Bundle-cli scans html and markdown files only if they are declared as part of its example expression `src/**/*.{html,md}`.

```html
<my-component></my-component>
<script type="module" src="./components/my-component/my-component.js"></script>
```

These documents can declare a header fragment to define data to share for the generation of the html, eg:

```html
---
title: My component
---

<h1>{{page.title}}</h1>
<my-component></my-component>
<script type="module" src="./components/my-component/my-component.js"></script>
```

the template syntax supported by bundle-cli is [liquidjs](https://liquidjs.com/).

### template and layout properties

The `template` property allows you to define a parent template for another that declares its use using the `layout` property., eg:

**master.html**

```html
---
template: master
title: template master!
---

<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{{page.title}}</title>
  </head>
  <body>
    {{page.content}}
  </body>
</html>
```

**any.html**

```html
---
layout: master
title: any file
---

<h1>template ? {{layout.title}}</h1>
<h1>page title ? {{page.title}}</h1>
```

> The template that declares the layout, will inherit the data of the superior template through the `layout` property.

### The context

The data that is shared with the tempate seeks to facilitate the construction of static sites. this context consists of:

- **pkg** : allows access to the given package.json, eg `{{pkg.name}}`.
- **pages** : Pages extracted by expression, eg `{{pages[0].title}}`
- **page** : Current page, eg`{{page.title}}`
- **layout** : Data inherited from the template page, eg `{{layout.color}}`.

## Recommended use

We recommend using bundle-cli by defining the scripts in your package.json, eg:

```json
{
  "scripts": {
    "start": "bundle example/src/**/*.{html,md} public --server --watch",
    "build": "bundle example/src/*.{html,md} public --minify bundle"
  }
}
```
