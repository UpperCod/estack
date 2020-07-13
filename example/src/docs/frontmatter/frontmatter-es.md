---
title: EStack
description: Entorno productivo basado en una pila de herramientas perfectamente sincornizadas
link: es/frontmatter
linkTitle: Frontmatter
lang: es
tag: doc
order: 1
---

## Frontmatter yaml

permite declarar fragmento de datos en la cabezera del documento en formato yaml para ser procesados por EStack y luegos enviados a liquid para la generacion del HTML final, ej:

```
---
title : my page
---

## {{ page.title }}

```

## Prorpiedades especiales

### draft

```yaml
draft: true
```

declara que este documento es un borrador, por lo que sera ignorado al momento de realizar la build.

### slug

```yaml
slug: my-page
```

declara el nombre del documento a fijar como destino

### folder

```yaml
folder: posts
```

declara la carpeta a usar como destino para el documento

### link

```yaml
link: posts/my-page
```

Declara de forma conjunta slug y folder

### symlink

```yaml
symlink: home
```

declara un link simbolico que permite referencia este documento a través de la variable global links, ej:

```markdown
Esta es mi pagina principal [{{ links.home.title }}]({{ links.home.link }})
```

**Considere synlink una poderosa utilidad ya que permite acceder a toda la informacion declarada del documento referenciado, como las query, fetch o assets.**

> **Los synlink y links deben ser únicos**, EStack enseñara un mensaje de error cuando un symlink o link este duplicado.

### assets

Esta porpiedad permite associar recursos a la pagina, estos recursos pueden ser usados por la pagina sin la necesidad de declarar el tag assets, utilizelos para compartir contenido local con el template, sea por ejemplo una imagen de cabezera, eg:

```html
---
assets:
    banner: ./banner.jpg
---

<img src="{{page.assets.banner}}" alt="my banner" />
```

**Recurede las resoluciones de assets son relativas al archivo que lo demanda, esto mejora enormemente el nivel de abtraccion de los recursos asociados a la pagina**.

### query

declara las consultas que el documento realiza sobre todas las paginas, estas consultas deben ser agrupadas a base de un indice y deben declarar un objeto tipo query, ej:

```yaml
query:
    post:
        where:
            tag: post
        limit: 5
        sort: date
        order: -1
```

Donde:

1. `query.post` : agrupara los resultados de la query, para luego ser usados en el documento, eg `{{ page.query.post | json }}`
    - `query.post.where` : define la consulta por incluir igualdad, el where enseñado retornara todas las paginas que declaren la propiedad `tag : post`
    - `query.post.limit` : Limita los resultados de la query a maximo 5
    - `query.post.sort` : ordena la quiery a base de la propeidad date declarada en la pagina.
    - `query.post.order` : oderna los resultados de mayor a menor.

### Fetch

Declara request o asociacion de documentos local como fuentes de datos observable, ej

```yaml
fetch:
    # Los request son cachados por cada instancia del EStack
    todo: https://jsonplaceholder.typicode.com/todos
    # Archivos locales, sincronizados al documento
    config: ./my-config.yaml
    users: ./my-users.json
```

Ud podra usar los resultados de fetch a travez de la propiedad `page.fetch.<prop>`, ej:

```html
{% for todo in page.fetch.todos %}
<h2>{{ todo.title }}</h2>
{% endfor %}
```

### links

Permite crear un objeto capas de recuperar los links finales a base de origenes relativos de archivos, esta propeidad es util para contruccion de variaciones de pagina o paginas relacionadas.

```yaml
links:
    prev:
        link: ./paso-0.md
        linkTitle: comenzando
    next:
        link: ./paso-2.md
        linkTitle: paso 2
    langs: ./langs.yaml ## Los linsk pueden probenir de un documento en comun
    recommend:
        - link: ../tutorial-2/tutorial-2.md
          linkTitle: Aprendiendo algo similar
        - link: ../tutorial-3/tutorial-3.md
          linkTitle: Aprendiendo algo similar
```

> `page.links` contendra los links finales de los archivos asociados al archivo.

### template

```yaml
template: post
```

Declara que el documento es un template, los template pueden ser usados por otros documentos mediante la propiedad `layout`, Ud puede definir `template: default` para definir el documento template como por defecto para las contrucciones de pagina que no declaren layout.

**las pagina tipo template pueden hacer uso de todo el frontmatter, la data asociada a un tempalte se asocia a la variable global `layout`, esta puede ser usada por la pagina que aplica el o el mismo template**.

**Los template escapan de la variable global `links`**

```html
---
title: mi template
color: black
---

<!DOCTYPE html>
<html lang="{{page.lang}}">
    <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{{page.title}}</title>
        <link rel="stylesheet" href="{{ './my-template.css' | asset }}" />
    </head>
    <body style="background:{{layout.color}}">
        <main>{{page.content}}</main>
        <footer>{{layout.title}}</footer>
    </body>
</html>
```

### layout

```yaml
layout: post
```

Declara que `template` usara el documento para su reprecentacion como pagina. Puede definir `layout: false` para escapar del template definido como default

### archive

Esta propiedad permite crear paginas de archivo.
