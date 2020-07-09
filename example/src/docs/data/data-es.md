---
title: EStack
description: En entorno productivo basado en una pila de herramientas perfectamente sincornizadas
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

declara la carpeta a usar como destino del documento

### link

```yaml
link: posts/my-page
```

Declara de forma conjunta slug y folder

### symlink

```yaml
symlink: home
```

declara un link simbolico que permite referencia este documento a través de la propiedad links, ej:

```markdown
Esta es mi pagina principal [{{ links.home.title }}]({{ links.home.link }})
```

**Considere synlink una poderosa utilidad ya que permite acceder a toda la informacion declarada del documento referenciado, como las query, fetch o assets.**

> **Los synlink y links deben ser únicos**, EStack enseñara un mensaje de error cuando un alias o link este duplicado.

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
  # Cada edición genera una nueva lectura de los documentos legales vinculados
  config: ./my-config.yaml
  users: ./my-users.json
```

Ud podra usar los resultados de fetch a travez de la propiedad `page.fetch.<prop>`, ej:

```html
{% for todo in page.fetch.todos %}
<h2>{{ todo.title }}</h2>
{% endfor %}
```

> Las asociaciones de documentos sincronizan los cambios del docuemto interno con quien lo associa.

### archive

Esta propiedad permite crear paginas de archivo.
