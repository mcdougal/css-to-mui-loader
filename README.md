# css-to-mui-loader
[![NPM version][npm-image]][npm-url]

Webpack loader for using external CSS files with [Material UI](https://github.com/mui-org/material-ui).

[Install](#install) | [Usage](#usage) | [Description](#description) | [Features](#features) | [Linting](#linting) | [Help out](#help-out)

## Install

```bash
npm install css-to-mui-loader
```

## Usage

**styles.css**
```css
.button {
  background: $(theme.palette.primary.main);
  padding: 2su; /* Material UI spacing units */
}

.button:hover {
  background: $(theme.palette.primary.light);
}
```

**MyComponent.js**
```js
import Button from '@material-ui/core/Button';
import { withStyles } from '@material-ui/core/styles';
import styles from './styles.css';

const MyComponent = withStyles(styles)(({ classes }) => (
  <Button className={classes.button}>
    Click Me
  </Button>
));
```

**webpack.config.js**
```js
module.exports = {
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [ 'babel-loader', 'css-to-mui-loader' ]
      }
    ]
  }
}
```

**NOTE:** `css-to-mui-loader` output currently relies on ES2015
[computed property names](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Object_initializer#Computed_property_names),
so for the time being you will have to run the output through a transpiling
loader, such as the `babel-loader`. I have plans to remove this requirement
but I'm not quite there yet.

## Description

The `css-to-mui-loader` allows you to write external CSS files then import them for use in your Material UI components. It provides shortcuts for accessing the Material UI theme within the CSS itself.

Why?

1. CSS is more concise
2. Designers don't want to write JS
3. You can copy/paste CSS directly from Chrome Inspector
4. You still get component-scoped CSS and a centralized theme

## Features

Provides custom unit for Material UI spacing
```css
.spacing {
  padding: 10su; /* Equal to theme.spacing.unit * 10 */
}
```

Provides access to the Material UI theme
```css
.theme {
  color: $(theme.palette.primary.main);
  z-index: $(theme.zIndex.appBar);
}
```

Supports media queries using the Material UI theme breakpoints
```css
@media $(theme.breakpoints.down('sm')) {
  .media {
    display: none;
  }
}
```

Allows Material UI theme objects to be included as mixins
```css
.mixins {
  -mui-mixins: theme.typography.display4, theme.shape;
}
```

Supports classes, child selectors and pseudo-classes
```css
.parent.qualifier .child:hover * {
  padding: 10px;
}
```

Supports CSS variables
```css
:root {
  --small-spacing: 2su;
}

.variables {
  margin: var(--small-spacing);
}
```

Supports keyframes
```css
@keyframes my-animation {
  0% { opacity: 0; }
  100% { opacity: 1; }
}

.keyframes {
  animation: my-animation 1s ease-in-out;
}
```

If you want to know what the loader output looks like,
[take a look at the tests](/css-to-mui-loader.test.js).

## Linting

Some linters might complain about the custom syntax, but there are usually rules you can enable to address this. For example, the following `.stylelintrc` for [stylelint](https://github.com/stylelint/stylelint) does not raise any errors with the custom `css-to-mui-loader` syntax:

```json
{
  "extends": "stylelint-config-standard",
  "plugins": [
    "stylelint-order"
  ],
  "rules": {
    "function-name-case": null,
    "property-no-unknown": [
      true,
      {
        "ignoreProperties": ["-mui-mixins"]
      }
    ],
    "unit-no-unknown": [
      true,
      {
        "ignoreUnits": ["/^su$/"]
      }
    ]
  }
}
```

## Help out

Pull requests, issues, complaints and suggestions are all welcome.

[npm-image]: https://img.shields.io/npm/v/css-to-mui-loader.svg?style=flat-square
[npm-url]: https://npmjs.org/package/css-to-mui-loader
