#eslint-plugin-fast-fluentui-tsdoc-rules

eslint rules for TSDoc comments validation in [FAST](https://github.com/microsoft/fast) and [Fluent UI](https://github.com/microsoft/fluentui/tree/web-components-v3/packages/web-components) Web Components packages.

## Install

### Fluent UI

    yarn add @asaperski/eslint-plugin-fast-fluentui-tsdoc-rules@0.4 --dev

### FAST

    yarn add @asaperski/eslint-plugin-fast-fluentui-tsdoc-rules --dev

## Example Configuration

Add to your `.eslintrc`:

``` js
{
    "plugins": ["fast-fluentui-tsdoc-rules"],
    "rules": {
        // other rules...
        "@asaperski/fast-fluentui-tsdoc-rules/tsdoc-html-element": "warn",
        "@asaperski/fast-fluentui-tsdoc-rules/tsdoc-html-attribute": "warn"
    }
}
```

## Rules

### tsdoc-html-element

> Detects missing, incorrectly formatted TSDoc comments which describe HTML element

```js
import { FluentDesignSystem } from '../fluent-design-system.js';
import { Component } from './component.js';
import { styles } from './component.styles.js';
import { template } from './component.template.js';

export const definition = Component.compose({
  name: `${FluentDesignSystem.prefix}-component`,
  template,
  styles,
});
```

Produces the following output:

     6:1  warning  TSDoc comment is missing. Should specify HTML element name in description of @remarks tag  fast-fluentui-tsdoc-rules/tsdoc-html-element

```js
import { FluentDesignSystem } from '../fluent-design-system.js';
import { Component } from './component.js';
import { styles } from './component.styles.js';
import { template } from './component.template.js';

/**
 * @remarks
 * HTML Element: \<fluent-other-component\>
 */
export const definition = Component.compose({
  name: `${FluentDesignSystem.prefix}-component`,
  template,
  styles,
});
```

Produces the following output:

     10:1  warning  Wrong HTML element name is specified in @remarks tag, expected: \<fluent-component\>  fast-fluentui-tsdoc-rules/tsdoc-html-element

```js
import { FluentDesignSystem } from '../fluent-design-system.js';
import { Component } from './component.js';
import { styles } from './component.styles.js';
import { template } from './component.template.js';

/**
 * @remarks
 * HTMLElement: \<fluent-component\>
 */
export const definition = Component.compose({
  name: `${FluentDesignSystem.prefix}-component`,
  template,
  styles,
});
```

Produces the following output:

     10:1  warning  Invalid HTML element name descripion, expected: HTML Element: \<fluent-component\>  fast-fluentui-tsdoc-rules/tsdoc-html-element


### tsdoc-html-attribute

> Detects missing, incorrectly formatted TSDoc comments which describe attribute of HTML element

```js
import { attr, FASTElement } from "@microsoft/fast-element";

export class FASTTab extends FASTElement {
    @attr
    public disabled: boolean;
}
```

Produces the following output:

     4:5  warning  TSDoc comment is missing. Should specify HTML attribute name in description of @remarks tag  fast-fluentui-tsdoc-rules/tsdoc-html-attribute

```js
import { attr, FASTElement } from "@microsoft/fast-element";

export class FASTTab extends FASTElement {
    /**
     * @remarks
     * HTML Attribute: enabled
     */
    @attr
    public disabled: boolean;
}
```

Produces the following output:

     8:5  warning  Wrong HTML attribute name is specified in @remarks tag, expected: disabled  fast-fluentui-tsdoc-rules/tsdoc-html-attribute

```js
import { attr, FASTElement } from "@microsoft/fast-element";

export class FASTTab extends FASTElement {
    /**
     * @remarks
     * HTML Attribute: disabled
     */
    @attr({attribute: "data-disabled"})
    public disabled: boolean;
}
```

Produces the following output:

     8:5  warning  Wrong HTML attribute name is specified in @remarks tag, expected: data-disabled  fast-fluentui-tsdoc-rules/tsdoc-html-attribute

```js
import { attr, FASTElement } from "@microsoft/fast-element";

export class FASTTab extends FASTElement {
    /**
     * @remarks
     * HTML Attr: disabled
     */
    @attr
    public disabled: boolean;
}
```

Produces the following output:

     8:5  Invalid HTML attribute name descripion, expected: HTML Attribute: disabled  fast-fluentui-tsdoc-rules/tsdoc-html-attribute
