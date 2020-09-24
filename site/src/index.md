---
title: EStack
description: Static site generator for modern development
order: 1
linkTitle: Introducción
category: aside
---

EStack brings together in a single observer a series of recurring tools for scalable modern development:

<doc-tabs tabs="t1, t2">

# hola 1

# hola 2

</doc-tabs>

<doc-row col="1fr 1fr 1fr, 1fr 1fr 520w" gap="2rem">

<div>

### Development server

The `dev` mode creates a server with livereload that
delete prevents writing to disk.

</div>

<div>

### Frontmatter

page variables in the
document header

```yaml
title: my page...
items:
    $ref: items.json
thumbnail:
    $link: header.jpg
```

</div>

<div>

### Multilanguage

EStack relates the language from page to base
extensions, eg:

```bash
index.es.md # Spanish
index.fr.md # French
index.md    # English
```

</div>

<div>

### Manage Assets

Estack captures all assets
declared in the frontmatter or template

</div>

<div>

### Manage CSS

CSS type assets are processed
by Postcss

</div>

<div>

### Manage JS

JS type assets are processed by
Rollup

</div>

</doc-row>
