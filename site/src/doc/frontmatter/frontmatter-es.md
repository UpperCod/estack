---
title: Frontmatter
link: es/frontmatter
description: Mágicamente Simple y Poderoso
linkTitle: Frontmatter
lang: es
category:
    - header
---

El frontmatter mejora la experiencia de generacion de contenido estatico, con el frontmatter de EStack podrás:

1. Modificar link de escritura mediante la propeidad [link](#link-string).
2. Asociar lenguaje mediante la propiedad [lang](#lang-string).
3. Asociar categorias mediante la propiedad [category](#category-string).
4. Asociar assets.
5. Contruir data mediante la propiedades [\$link](#link-string-1) y [\$ref](#ref-string).
6. Realizar request a servicios.
7. Declarar paginas como templates y usarlas mediante layout.

## Schema

### link: string

**Alias permalink**, declara el link de la pagina para escritura, ejemplo:

```yaml
link: folder/users
```

Esta pagina será escrita en el destino como `folder/users.html`

```yaml
link: folder/users/
```

Esta pagina sera escrita en el destino como `folder/users/index.html`

### lang: string

Declara un lenguaje para la pagina, lang es asociado al objeto `category` para consultas.

### category: string[]

Declara una o mas categorias para la pagina, estas categorias se asoican al objeto `category` para consultas.

### fragment: string

Declara la pagina como fragmento, las paginas de tipo fragmento solo se imprimen a demanda mediante el uso del tag `{{ '{% fragment myFragment with ...data %}' }}`

### tempalte: string

Declara la pagina como plantilla, si el tempalte se define como `default`, todas las paginas que no declaren layout heredaran la plantilla default

### global: string

Permite recuperar la pagina mediante el objeto `global`, **Esto con la finalidad de acceder a toda la data que la pagina contenga**

### \$ref: string

Permite relacionar archivos externos a la pagina, sea desde urls o locales, ejemplo:

```yaml
todos:
    $ref: https://jsonplaceholder.typicode.com/todos
users:
    $ref: users.yaml
menu:
    $ref: site.yaml~menu
author:
    $ref: autors.yaml~uppercod
    label: autor
```

### \$link: string

Permite construir links, los links fuerzan la carga de los archivos a la build para la asociacion como recurso sea pagina o asset, ejemplo:

```yaml
thumbnail:
    $link: thumbnail-320x220.jpg
menu:
    - $link: home.md
    - $link: user.md
    - $link: contact.md
```
