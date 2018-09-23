# css-to-mui-loader
[![NPM version][npm-image]][npm-url]

Webpack loader for converting CSS to JSS, designed specifically for use with [Material UI](https://github.com/mui-org/material-ui).

[Install](#install) | [Usage](#usage) | [Description](#description) | [Features](#features) | [Linting](#linting) | [License](#license) | [Help out](#help-out)

## Install

```bash
npm install css-to-mui-loader
```

## Usage

**webpack.config.js**
```js
module.exports = {
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [ 'css-to-mui-loader' ]
      }
    ]
  }
}
```

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

**component.js**
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

## Description

The `css-to-mui-loader` allows you to write external CSS files then import them for use in your Material UI components. It provides shortcuts for accessing the Material UI theme within the CSS itself.

Why?

1. CSS is more concise
2. Designers don't want to write JS
3. You can copy/paste CSS directly from Chrome Inspector
4. You still get component-scoped CSS and a centralized theme

## Features

```css
/* Provides custom unit for Material UI spacing */
.spacing {
  padding: 10su; /* Equal to theme.spacing.unit * 10 */
}

/* Provides access to the Material UI theme */
.theme {
  color: $(theme.palette.primary.main);
  z-index: $(theme.zIndex.appBar);
}

/* Supports media queries using the Material UI theme breakpoints */
@media $(theme.breakpoints.down('sm')) {
  .media {
    display: none;
  }
}

/* Allows Material UI theme objects to be included as mixins */
.mixins {
  -mui-mixins: theme.typography.display4, theme.shape;
}

/* Supports classes, child selectors and pseudo-classes */
.parent.qualifier .child:hover * {
  padding: 10px;
}

/* Supports CSS variables */
:root {
  --small-spacing: 2su;
}

.variables {
  margin: var(--small-spacing);
}

/* Supports keyframes */
@keyframes my-animation {
  0% { opacity: 0; }
  100% { opacity: 1; }
}

.keyframes {
  animation: my-animation 1s ease-in-out;
}
```

Using the `css-to-mui-loader`, the example above would get transpiled to the following JS:

```js
module.exports = function cssToMuiLoader(theme) {
  const smallSpacing = `${theme.spacing.unit * 2}px`;

  return {
    '@keyframes my-animation': {
      '0%': {
        opacity: `0`,
      },
      '100%': {
        opacity: `1`,
      },
    },
    spacing: { padding: `${theme.spacing.unit * 10}px` },
    theme: {
      color: `${theme.palette.primary.main}`,
      zIndex: `${theme.zIndex.appBar}`,
    },
    mixins: { ...theme.typography.display4, ...theme.shape },
    qualifier: {},
    child: {},
    parent: {
      '&$qualifier $child:hover *': {
        padding: `10px`,
      },
    },
    variables: { margin: `${smallSpacing}` },
    keyframes: { animation: `my-animation 1s ease-in-out` },
    [theme.breakpoints.down('sm')]: {
      media: { display: `none` },
    },
  };
};
```

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

## License

[MIT](https://tldrlegal.com/license/mit-license)

## Help out

Pull requests, issues, complaints and suggestions are all welcome.

[npm-image]: https://img.shields.io/npm/v/css-to-mui-loader.svg?style=flat-square
[npm-url]: https://npmjs.org/package/css-to-mui-loader
