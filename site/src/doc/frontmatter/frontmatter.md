---
title: Frontmatter
description: Mágicamente Simple y Poderoso
linkTitle: Frontmatter
lang: en
category:
    - header
---

The frontmatter improves the experience of generating static content, with the EStack frontmatter you can:

1. Modify write link using the property [link](#link-string).
2. Associate language using the [lang](#lang-string) property.
3. Associate categories using the [category](#category-string) property.
4. Associate assets.
5. Build data using the properties [\$link](#link-string-1) and [\$ref](#ref-string).
6. Make request to services
7. Declare pages as templates and use them through layout

## Schema

### link: string

**Alias permalink**, declare the link of the page to write, example:

```yaml
link: folder/users
```

This page will be written in the destination as `folder/users.html`.

```yaml
link: folder/users/
```

This page will be written in the destination as `folder/users/index.html`.

### lang: string

Declare a language for the page, lang is associated with the `category` object for queries.

### category: string[]

Declare one or more categories for the page, these categories are associated with the `category` object for queries.

### fragment: string

Declare the page as a fragment, fragment type pages are only printed on demand by using the tag `{{'{% fragment myFragment with ... data%}'}}`.

### tempalte: string

Declare the page as a template, if the template is defined as `default`, all the pages that do not declare layout will inherit the default template.

### global: string

It allows to retrieve the page through the `global` object, **This in order to access all the data that the page contains**.

### \$ref: string

It allows to relate external files to the page, either from urls or local, example:

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

It allows to build links, the links force the loading of the files to the build for the association as a resource, be it page or asset, example:

```yaml
thumbnail:
    $link: thumbnail-320x220.jpg
menu:
    - $link: home.md
    - $link: user.md
    - $link: contact.md
```
