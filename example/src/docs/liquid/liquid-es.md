---
title: EStack
description: En entorno productivo basado en una pila de herramientas perfectamente sincornizadas
link: es/liquid
linkTitle: Liquid
lang: es
tag: doc
order: 2
---

## Liquid

La sincronizacion de assets es gracias a liquidjs y sus tag y filtros personalizables, estack se sincronzia a trabes de e ellos permitiendo conocer del documento que fuente se ha declarado como asset.

## Filtros

### filtro asset

Este filtro declara un asset local dentro de la pagina, la direcion del asset es relativa al archivo que lo declara, permitiendo mejor nivel de abstraccion de los archivos asociados a la pagina.

```bash
+---user #folder
    |---style.css
    |---user.js
    |---avatar.png
    |---user.html
```

```markup
<link rel="stylesheet" href="{{ './style.css' | asset }}" />
<script src="{{ './page.js' | asset }}" type="module"></script>
<img src="{{ './avatar.png' | asset }}" alt="Ejemplo de asset para estack" />
```

De igual forma este filtro puede crear etiquetas optimizadas, evitando por ejemplo que se duplique la importacion del asset, eg:

```liquid
{{ './user.js' | asset: tag: true }}
{{ './user.js' | asset: tag: true }}
{{ './user.js' | asset: tag: true }}
```

Indiferente a la cantidad de importaciones la pagina solo imprimira un tag `script`

### filtro group

Permite agrupar un array de objetos, a base de una de sus propeidades, eg:

```liquid
---
data :
    - tag : a
    - tag : b
    - tag : c
---

{% assign groups = page.data | group: "tag" %}

{% for group in groups %}
    <h1>{{ group.title }}</h1>
    {% for item in group.item %}
        <span> {{item.tag}} </span>
    {% endfor %}
{% endfor %}
```

### filtro markdown

Permite aplicar markdown sobre un texto

```
{{ page.description |  markdown }}
```

### filtro highlighted

Permite aplicar highlighted sobre un texto

```
{{ page.exampleCode |  highlighted }}
```

## Tags

### Tag fragment

Este tag permite seccionar el html en fragmentos independientes cuyo contexto es extendido al momento de su uso, los tag se crean mediante frontmatter, eg:

```markup
---
fragment : my-fragment
title : Title!
description : lorem...
---
<h1>{{title}}</h1>
<p>{{description}}</p>
```

```liquid
{% fragment my-fragment with title : "new title!" %}
```

> A diferencia de las paginas los fragmentos son de alcance cerrado no pudiendo hacer uso de los tags.

### Tag fetch

Este tag permite un acceso a un fichero o generar un request y asociarlo como una variable precente solo en el contexto de la pagina, eg:

```liquid
{% fetch todos = "https://jsonplaceholder.typicode.com/todos" %}

{% for todo in todos %}
    {{todo.title}}
{% endfor %}

{% fetch config = "./config.yaml" %}

{{config.title}}
```

Las llamadas externas a apis son cacheadas entre instancias, si el recurso es local los cambios sobre el recurso regeneran la pagina que demanda el recurso, esto con la finalidad de reflejar dichos cambios.
