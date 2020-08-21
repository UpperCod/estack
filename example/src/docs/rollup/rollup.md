---
title: rollup
lang: en
tag: doc
order: 3
links:
    langs:
        $ref: ./links.yaml
---

# hi?

{% for item in page.links %}
[{{item.linkTitle}}]({{item.link}})
{% endfor %}
