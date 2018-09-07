# css-to-mui-loader
[![NPM version][npm-image]][npm-url]

Webpack loader for converting CSS to JSS, designed specifically for [Material UI](https://github.com/mui-org/material-ui).

[Install](#install) | [Usage](#usage) | [Description](#description) | [Features](#features) | [License](#license) | [Help out](#help-out)

## Install

npm install --save-dev css-to-mui-loader

## Usage

The `css-to-mui-loader` currently uses `export default` in its output, so you'll need to chain an appropriate loader in your CSS rule (such as [babel-loader](https://github.com/babel/babel-loader)).

**webpack.config.js**
```js
module.exports = {
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [ 'babel-loader', 'css-to-mui-loader ]
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
import styles from './styles';

const MyComponent = withStyles(styles)(({ classes }) => (
  <Button className={classes.button}>
    Click Me
  </Button>
));
```

## Description

The `css-to-mui-loader` allows you to write external CSS files then import them for use in your Material UI components. It provides shortcuts for accessing the Material UI theme within the CSS itself.

## Features

### Write CSS, get JSS

**Input**
```css
.test {
  padding 10px;
}
```

**Output**
```js
export default (theme) => {
  return {
    test: { padding: `10px` },
  };
};
```

### Multiple/child selectors

**Input**
```css
.test1.test2 .test3 * {
  padding: 10px;
}
```

**Output**
```js
export default (theme) => {
  return {
    test2: {},
    test3: {},
    test1: {
      '&$test2 $test3' *: {
        padding: `10px`,
      },
    },
  };
};
```

### Pseudo-classes

**Input**
```css
.test:hover {
  background: pink;
}
```

**Output**
```js
export default (theme) => {
  return {
    test: {
      '&:hover': {
        background: `pink`,
      },
    },
  };
};
```

### Custom unit for Material UI spacing

**Input**
```css
.test {
  padding: 10su;
}
```

**Output**
```js
export default (theme) => {
  return {
    test: { padding: `${theme.spacing.unit * 10}px` },
  };
};
```

Note: You may want to configure [stylelint](https://github.com/stylelint/stylelint) to ignore this unit:

**.stylelintrc**
```json
{
  "rules": {
    "unit-no-unknown": [
      true,
      {
        "ignoreUnits": ["/^su$/"]
      }
    ]
  }
}
```

### Access to the Material UI theme

**Input**
```css
.test {
  color: $(theme.palette.primary.main);
}
```

**Output**
```js
export default (theme) => {
  return {
    test: { color: `${theme.palette.primary.main}` },
  };
};
```

Note: You can write any JavaScript you want in the `$(...)`. Since the theme is provided as a variable in the output, this construct is a convenient way to access it.

### CSS variables

**Input**
```css
:root {
  --my-color: blue;
}

.test {
  background: var(--my-color);
}
```

**Output**
```js
export default (theme) => {
  const myColor = `blue`;
  return {
    test: { background: `${myColor}` },
  };
};
```

### Media queries using Material UI's breakpoints

**Input**
```css
.test {
  padding: 20px;
}

@media $(theme.breakpoints.down('xs')) {
  .test {
    padding: 5px;
  }
}
```

**Output**
```js
export default (theme) => {
  return {
    test: { padding: `20px` },
    [theme.breakpoints.down('xs')]: {
      test: { padding: `5px` },
    },
  };
};
```

### Mixins

**Input**
```css
.test {
  -mui-mixins: theme.mixins.customMixin;
  padding: 10px;
}
```

**Output**
```js
export default (theme) => {
  return {
    test: {
      ...theme.mixins.customMixin,
      padding: \`10px\`,
    },
  };
};
```

## License

[MIT](https://tldrlegal.com/license/mit-license)

## Help out

Pull requests, issues, complaints and suggestions are all welcome.

[npm-image]: https://img.shields.io/npm/v/vmd.svg?style=flat-square
[npm-url]: https://npmjs.org/package/css-to-mui-loader
