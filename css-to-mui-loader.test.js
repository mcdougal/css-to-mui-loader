const prettier = require(`prettier`);
const cssToMuiLoader = require(`./css-to-mui-loader`);

const OBJECT_ASSIGN_POLYFILL = `
  function cssToMuiLoaderAssign(target, varArgs) {
    // .length of function is 2
    'use strict';
    if (target == null) {
      // TypeError if undefined or null
      throw new TypeError('Cannot convert undefined or null to object');
    }
    var to = Object(target);
    for (var index = 1; index < arguments.length; index++) {
      var nextSource = arguments[index];
      if (nextSource != null) {
        // Skip over if undefined or null
        for (var nextKey in nextSource) {
          // Avoid bugs when hasOwnProperty is shadowed
          if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
            to[nextKey] = nextSource[nextKey];
          }
        }
      }
    }
    return to;
  }
`;

const runLoader = (css) => {
  return prettier
    .format(cssToMuiLoader(css), {
      parser: `babel`,
      arrowParens: `always`,
      bracketSpacing: true,
      semi: true,
      singleQuote: true,
      tabWidth: 2,
      trailingComma: `all`,
    })
    .replace(/\s+$/gm, ``)
    .trim();
};

it(`throws an error on invalid CSS syntax`, () => {
  const css = `
.test {
  padding 10px;
}
  `;

  expect(() => {
    runLoader(css);
  }).toThrow();
});

it(`works on single rule with single property`, () => {
  const css = `
.test {
  padding: 10px;
}
  `;

  const jss = `
module.exports = function cssToMuiLoader(theme) {
  return {
    test: {
      padding: '10px',
    },
  };
};
  `;

  expect(runLoader(css)).toBe(jss.trim());
});

it(`supports rule names with dashes`, () => {
  const css = `
.test-dash {
  padding: 10px;
}
  `;

  const jss = `
module.exports = function cssToMuiLoader(theme) {
  return {
    'test-dash': {
      padding: '10px',
    },
  };
};
  `;

  expect(runLoader(css)).toBe(jss.trim());
});

it(`works on values with quotes before the end`, () => {
  const css = `
.quote-test {
  font-family: 'Times New Roman', $(theme.typography.caption.fontFamily);
}
  `;

  const jss = `
module.exports = function cssToMuiLoader(theme) {
  return {
    'quote-test': {
      fontFamily: "'Times New Roman', " + theme.typography.caption.fontFamily,
    },
  };
};
  `;

  expect(runLoader(css)).toBe(jss.trim());
});

it(`works on values with quotes at end`, () => {
  const css = `
.quote-test {
  font-family: $(theme.typography.caption.fontFamily), 'Times New Roman';
}
  `;

  const jss = `
module.exports = function cssToMuiLoader(theme) {
  return {
    'quote-test': {
      fontFamily: theme.typography.caption.fontFamily + ", 'Times New Roman'",
    },
  };
};
  `;

  expect(runLoader(css)).toBe(jss.trim());
});

it(`works on values with quotes at beginning and end`, () => {
  const css = `
.quote-test {
  font-family:
    'Arial', $(theme.typography.caption.fontFamily), 'Times New Roman';
}
  `;

  const jss = `
module.exports = function cssToMuiLoader(theme) {
  return {
    'quote-test': {
      fontFamily:
        "'Arial', " +
        theme.typography.caption.fontFamily +
        ", 'Times New Roman'",
    },
  };
};
  `;

  expect(runLoader(css)).toBe(jss.trim());
});

it(`works on empty string`, () => {
  const css = `
.quote-test::before {
  content: '';
}
  `;

  const jss = `
module.exports = function cssToMuiLoader(theme) {
  return {
    'quote-test': {
      '&::before': {
        content: "''",
      },
    },
  };
};
  `;

  expect(runLoader(css)).toBe(jss.trim());
});

it(`works on strings with single and double quotes`, () => {
  const css = `
.quote-test::before {
  content: "\\"Let's go to the store,\\" he said.";
}
  `;

  const jss = `
module.exports = function cssToMuiLoader(theme) {
  return {
    'quote-test': {
      '&::before': {
        content: '""Let\\'s go to the store," he said."',
      },
    },
  };
};
  `;

  expect(runLoader(css)).toBe(jss.trim());
});

it(`works on content with multiple values`, () => {
  const css = `
.quote-test::before {
  content: "$0" counter(my-awesome-counter) '.00';
}
  `;

  const jss = `
module.exports = function cssToMuiLoader(theme) {
  return {
    'quote-test': {
      '&::before': {
        content: '"$0" counter(my-awesome-counter) \\'.00\\'',
      },
    },
  };
};
  `;

  expect(runLoader(css)).toBe(jss.trim());
});

it(`works on values with newlines`, () => {
  const css = `
.test {
  border-color: transparent transparent transparent
    $(theme.palette.common.white);
}
  `;

  const jss = `
module.exports = function cssToMuiLoader(theme) {
  return {
    test: {
      borderColor:
        'transparent transparent transparent     ' + theme.palette.common.white,
    },
  };
};
  `;

  expect(runLoader(css)).toBe(jss.trim());
});

it(`throws an error on non-class selectors`, () => {
  const css = `
#test {
  padding: 10px;
}
  `;

  expect(() => {
    runLoader(css);
  }).toThrow();
});

it(`works on single rule with multiple selectors`, () => {
  const css = `
.test1, .test2 {
  padding: 10px;
}
  `;

  const jss = `
module.exports = function cssToMuiLoader(theme) {
  return {
    test1: {
      padding: '10px',
    },
    test2: {
      padding: '10px',
    },
  };
};
  `;

  expect(runLoader(css)).toBe(jss.trim());
});

it(`works on single rule with multiple properties`, () => {
  const css = `
.test {
  margin: 20px;
  padding: 10px;
}
  `;

  const jss = `
module.exports = function cssToMuiLoader(theme) {
  return {
    test: {
      margin: '20px',
      padding: '10px',
    },
  };
};
  `;

  expect(runLoader(css)).toBe(jss.trim());
});

it(`works on a single rule with multiple classes`, () => {
  const css = `
.test1.test2 {
  padding: 10px;
}
  `;

  const jss = `
module.exports = function cssToMuiLoader(theme) {
  return {
    test2: {},
    test1: {
      '&$test2': {
        padding: '10px',
      },
    },
  };
};
  `;

  expect(runLoader(css)).toBe(jss.trim());
});

it(`works on a single rule with multiple class levels`, () => {
  const css = `
.test1 .test2 {
  padding: 10px;
}
  `;

  const jss = `
module.exports = function cssToMuiLoader(theme) {
  return {
    test2: {},
    test1: {
      '& $test2': {
        padding: '10px',
      },
    },
  };
};
  `;

  expect(runLoader(css)).toBe(jss.trim());
});

it(`works on a child all selector`, () => {
  const css = `
.test1 * {
  padding: 10px;
}
  `;

  const jss = `
module.exports = function cssToMuiLoader(theme) {
  return {
    test1: {
      '& *': {
        padding: '10px',
      },
    },
  };
};
  `;

  expect(runLoader(css)).toBe(jss.trim());
});

it(`maintains ordering of properties`, () => {
  const css = `
.test {
  align-items: center;
  background-color: $(theme.palette.gray[200]);
  border-left: 2px solid transparent;
  display: flex;
  flex-direction: column;
  font-size: inherit;
  margin: 20px;
  max-width: 600px;
  padding: 10px;
  white-space: nowrap;
}
  `;

  const jss = `
module.exports = function cssToMuiLoader(theme) {
  return {
    test: {
      alignItems: 'center',
      backgroundColor: theme.palette.gray[200],
      borderLeft: '2px solid transparent',
      display: 'flex',
      flexDirection: 'column',
      fontSize: 'inherit',
      margin: '20px',
      maxWidth: '600px',
      padding: '10px',
      whiteSpace: 'nowrap',
    },
  };
};
  `;

  expect(runLoader(css)).toBe(jss.trim());
});

it(`works on multiple rules with multiple properties`, () => {
  const css = `
.test1 {
  margin: 20px;
  padding: 10px;
}

.test2 {
  background: red;
  color: blue;
}
  `;

  const jss = `
module.exports = function cssToMuiLoader(theme) {
  return {
    test1: {
      margin: '20px',
      padding: '10px',
    },
    test2: {
      background: 'red',
      color: 'blue',
    },
  };
};
  `;

  expect(runLoader(css)).toBe(jss.trim());
});

it(`combines declarations from the same rule defined multiple times`, () => {
  const css = `
.test {
  margin: 20px;
}

.test {
  background: red;
  margin: 25px;
}
  `;

  const jss = `
module.exports = function cssToMuiLoader(theme) {
  return {
    test: {
      margin: '20px',
      background: 'red',
      margin: '25px',
    },
  };
};
  `;

  expect(runLoader(css)).toBe(jss.trim());
});

it(`ignores top-level comments`, () => {
  const css = `
/*
.todo {
  margin: 0;
}
*/
.test {
  padding: 10px;
}
  `;

  const jss = `
module.exports = function cssToMuiLoader(theme) {
  return {
    test: {
      padding: '10px',
    },
  };
};
  `;

  expect(runLoader(css)).toBe(jss.trim());
});

it(`ignores nested comments`, () => {
  const css = `
.test {
  padding: 10px;
  /*
  .todo {
    margin: 0;
  }
  */
}
  `;

  const jss = `
module.exports = function cssToMuiLoader(theme) {
  return {
    test: {
      padding: '10px',
    },
  };
};
  `;

  expect(runLoader(css)).toBe(jss.trim());
});

it(`ignores inline comments`, () => {
  const css = `
.test {
  padding: 10px; /* TODO: something */
}
  `;

  const jss = `
module.exports = function cssToMuiLoader(theme) {
  return {
    test: {
      padding: '10px',
    },
  };
};
  `;

  expect(runLoader(css)).toBe(jss.trim());
});

it(`converts hyphens to camelCase`, () => {
  const css = `
.test {
  text-align: center;
}
  `;

  const jss = `
module.exports = function cssToMuiLoader(theme) {
  return {
    test: {
      textAlign: 'center',
    },
  };
};
  `;

  expect(runLoader(css)).toBe(jss.trim());
});

it(`converts custom units for single positive integer value`, () => {
  const css = `
.test {
  padding: 10su;
}
  `;

  const jss = `
module.exports = function cssToMuiLoader(theme) {
  return {
    test: {
      padding: theme.spacing.unit * 10 + 'px',
    },
  };
};
  `;

  expect(runLoader(css)).toBe(jss.trim());
});

it(`converts custom units for single negative integer value`, () => {
  const css = `
.test {
  padding: -10su;
}
  `;

  const jss = `
module.exports = function cssToMuiLoader(theme) {
  return {
    test: {
      padding: theme.spacing.unit * -10 + 'px',
    },
  };
};
  `;

  expect(runLoader(css)).toBe(jss.trim());
});

it(`throws an error for a decimal custom unit`, () => {
  const css = `
.test {
  padding: 1.1su;
}
  `;

  expect(() => {
    runLoader(css);
  }).toThrow();
});

it(`converts custom units for multiple values`, () => {
  const css = `
.test {
  padding: 11su 12su 13su 14su;
}
  `;

  const jss = `
module.exports = function cssToMuiLoader(theme) {
  return {
    test: {
      padding:
        theme.spacing.unit * 11 +
        'px' +
        ' ' +
        theme.spacing.unit * 12 +
        'px' +
        ' ' +
        theme.spacing.unit * 13 +
        'px' +
        ' ' +
        theme.spacing.unit * 14 +
        'px',
    },
  };
};
  `;

  expect(runLoader(css)).toBe(jss.trim());
});

it(`converts custom units when one value is 0`, () => {
  const css = `
.test {
  padding: 0 2su;
}
  `;

  const jss = `
module.exports = function cssToMuiLoader(theme) {
  return {
    test: {
      padding: '0 ' + theme.spacing.unit * 2 + 'px',
    },
  };
};
  `;

  expect(runLoader(css)).toBe(jss.trim());
});

it(`does not convert custom units when the only value is 0`, () => {
  const css = `
.test {
  padding: 0;
}
  `;

  const jss = `
module.exports = function cssToMuiLoader(theme) {
  return {
    test: {
      padding: '0',
    },
  };
};
  `;

  expect(runLoader(css)).toBe(jss.trim());
});

it(`supports mixing custom units with builtin units`, () => {
  const css = `
.test {
  padding: 11px 1rem 0 10su;
}
  `;

  const jss = `
module.exports = function cssToMuiLoader(theme) {
  return {
    test: {
      padding: '11px 1rem 0 ' + theme.spacing.unit * 10 + 'px',
    },
  };
};
  `;

  expect(runLoader(css)).toBe(jss.trim());
});

it(`works when custom units are defined inside a transform`, () => {
  const css = `
.test {
  transform: translate(-3su);
}
  `;

  const jss = `
module.exports = function cssToMuiLoader(theme) {
  return {
    test: {
      transform: 'translate(' + theme.spacing.unit * -3 + 'px' + ')',
    },
  };
};
  `;

  expect(runLoader(css)).toBe(jss.trim());
});

it(`provides an escape hatch for running JS code`, () => {
  const css = `
.test {
  color: $(theme.palette.primary.main);
}
  `;

  const jss = `
module.exports = function cssToMuiLoader(theme) {
  return {
    test: {
      color: theme.palette.primary.main,
    },
  };
};
  `;

  expect(runLoader(css)).toBe(jss.trim());
});

it(`supports JS escape hatch if it's not the only thing on the line`, () => {
  const css = `
.test {
  transition: max-width $(theme.transitions.standard);
}
  `;

  const jss = `
module.exports = function cssToMuiLoader(theme) {
  return {
    test: {
      transition: 'max-width ' + theme.transitions.standard,
    },
  };
};
  `;

  expect(runLoader(css)).toBe(jss.trim());
});

it(`supports JS escape hatch with nested parens`, () => {
  const css = `
.test {
  border: 1px solid $(theme.utils.rgba(theme.palette.primary, .2));
}
  `;

  const jss = `
module.exports = function cssToMuiLoader(theme) {
  return {
    test: {
      border: '1px solid ' + theme.utils.rgba(theme.palette.primary, 0.2),
    },
  };
};
  `;

  expect(runLoader(css)).toBe(jss.trim());
});

it(`supports CSS variables with basic values`, () => {
  const css = `
:root {
  --my-color: blue;
}

.test {
  background: var(--my-color);
}
  `;

  const jss = `
module.exports = function cssToMuiLoader(theme) {
  const myColor = 'blue';
  return {
    test: {
      background: myColor,
    },
  };
};
  `;

  expect(runLoader(css)).toBe(jss.trim());
});

it(`supports CSS variables with custom units`, () => {
  const css = `
:root {
  --common-padding: 10su;
}

.test {
  padding: var(--common-padding);
}
  `;

  const jss = `
module.exports = function cssToMuiLoader(theme) {
  const commonPadding = theme.spacing.unit * 10 + 'px';
  return {
    test: {
      padding: commonPadding,
    },
  };
};
  `;

  expect(runLoader(css)).toBe(jss.trim());
});

it(`supports CSS variables with JS`, () => {
  const css = `
:root {
  --my-color: $(theme.palette.gray[200]);
}

.test {
  color: var(--my-color);
}
  `;

  const jss = `
module.exports = function cssToMuiLoader(theme) {
  const myColor = theme.palette.gray[200];
  return {
    test: {
      color: myColor,
    },
  };
};
  `;

  expect(runLoader(css)).toBe(jss.trim());
});

it(`supports CSS variables mixed with JS escape hatch`, () => {
  const css = `
:root {
  --transition-prop: max-width;
}

.test {
  transition: var(--transition-prop) $(theme.transitions.standard);
}
  `;

  const jss = `
module.exports = function cssToMuiLoader(theme) {
  const transitionProp = 'max-width';
  return {
    test: {
      transition: transitionProp + ' ' + theme.transitions.standard,
    },
  };
};
  `;

  expect(runLoader(css)).toBe(jss.trim());
});

it(`supports multiple CSS variables`, () => {
  const css = `
:root {
  --my-color: $(theme.palette.gray[200]);
  --my-padding: 2su;
}

.test {
  color: var(--my-color);
  padding: var(--my-padding);
}
  `;

  const jss = `
module.exports = function cssToMuiLoader(theme) {
  const myColor = theme.palette.gray[200];
  const myPadding = theme.spacing.unit * 2 + 'px';
  return {
    test: {
      color: myColor,
      padding: myPadding,
    },
  };
};
  `;

  expect(runLoader(css)).toBe(jss.trim());
});

it(`supports mix of CSS variables, JS escape hatch and custom units`, () => {
  const css = `
:root {
  --p: 1su;
}

.test {
  padding: 1px 2su var(--p) $(theme.p)px;
}
  `;

  const jss = `
module.exports = function cssToMuiLoader(theme) {
  const p = theme.spacing.unit * 1 + 'px';
  return {
    test: {
      padding:
        '1px ' + theme.spacing.unit * 2 + 'px' + ' ' + p + ' ' + theme.p + 'px',
    },
  };
};
  `;

  expect(runLoader(css)).toBe(jss.trim());
});

it(`supports basic keyframes`, () => {
  const css = `
@keyframes my-animation {
  0% { background: $(theme.palette.common.white); }
  100% { background: $(theme.palette.common.black); }
}
  `;

  const jss = `
module.exports = function cssToMuiLoader(theme) {
  return {
    '@keyframes my-animation': {
      '0%': { background: theme.palette.common.white },
      '100%': { background: theme.palette.common.black },
    },
  };
};
  `;

  expect(runLoader(css)).toBe(jss.trim());
});

it(`supports keyframes with multiple percentages`, () => {
  const css = `
@keyframes my-animation {
  0%, 75% { background: $(theme.palette.common.white); }
  25%, 90%, 100% { background: $(theme.palette.common.black); }
}
  `;

  const jss = `
module.exports = function cssToMuiLoader(theme) {
  return {
    '@keyframes my-animation': {
      '0%,75%': { background: theme.palette.common.white },
      '25%,90%,100%': { background: theme.palette.common.black },
    },
  };
};
  `;

  expect(runLoader(css)).toBe(jss.trim());
});

it(`supports keyframes with multiple declarations`, () => {
  const css = `
@keyframes my-animation {
  0% {
    background: $(theme.palette.common.white);
    padding: 1su;
  }

  100% {
    background: $(theme.palette.common.black);
    padding: 2su;
  }
}
  `;

  const jss = `
module.exports = function cssToMuiLoader(theme) {
  return {
    '@keyframes my-animation': {
      '0%': {
        background: theme.palette.common.white,
        padding: theme.spacing.unit * 1 + 'px',
      },
      '100%': {
        background: theme.palette.common.black,
        padding: theme.spacing.unit * 2 + 'px',
      },
    },
  };
};
  `;

  expect(runLoader(css)).toBe(jss.trim());
});

it(`overrides keyframes with the same name`, () => {
  const css = `
@keyframes my-animation {
  0% { background: $(theme.palette.common.white); }
}
@keyframes my-animation {
  100% { background: $(theme.palette.common.black); }
}
  `;

  const jss = `
module.exports = function cssToMuiLoader(theme) {
  return {
    '@keyframes my-animation': {
      '100%': { background: theme.palette.common.black },
    },
  };
};
  `;

  expect(runLoader(css)).toBe(jss.trim());
});

it(`supports keyframes with vendor prefixes`, () => {
  const css = `
@-webkit-keyframes my-animation {
  0% { opacity: 0; }
  100% { opacity: 1; }
}
  `;

  const jss = `
module.exports = function cssToMuiLoader(theme) {
  return {
    '@-webkit-keyframes my-animation': {
      '0%': { opacity: '0' },
      '100%': { opacity: '1' },
    },
  };
};
  `;

  expect(runLoader(css)).toBe(jss.trim());
});

it(`supports keyframes with comments`, () => {
  const css = `
@keyframes my-animation {
  0% {
    transform: translateY(-100%);
  }

  100% {
    transform: translateY(-100%);
    /* transform: translateY(-100%) rotateX(180deg); */
  }
}
  `;

  const jss = `
module.exports = function cssToMuiLoader(theme) {
  return {
    '@keyframes my-animation': {
      '0%': { transform: 'translateY(-100%)' },
      '100%': { transform: 'translateY(-100%)' },
    },
  };
};
  `;

  expect(runLoader(css)).toBe(jss.trim());
});

it(`supports media queries that are defined once`, () => {
  const css = `
.test {
  padding: 20px;
}

@media $(theme.breakpoints.down('xs')) {
  .test {
    padding: 5px;
  }
}
  `;

  const jss = `
module.exports = function cssToMuiLoader(theme) {
  var output = {
    test: {
      padding: '20px',
    },
  };
  output[theme.breakpoints.down('xs')] = {
    test: {
      padding: '5px',
    },
  };
  return output;
};
  `;

  expect(runLoader(css)).toBe(jss.trim());
});

it(`supports media queries that are defined more than once`, () => {
  const css = `
.test1 {
  padding: 20px;
}

@media $(theme.breakpoints.down('xs')) {
  .test1 {
    padding: 5px;
  }
}

@media $(theme.breakpoints.down('xs')) {
  .test1 {
    margin: 0;
  }
}

.test2 {
  padding: 50px;
}

@media $(theme.breakpoints.down('xs')) {
  .test2 {
    padding: 10px;
  }
}
  `;

  const jss = `
module.exports = function cssToMuiLoader(theme) {
  var output = {
    test1: {
      padding: '20px',
    },
    test2: {
      padding: '50px',
    },
  };
  output[theme.breakpoints.down('xs')] = {
    test1: {
      padding: '5px',
      margin: '0',
    },
    test2: {
      padding: '10px',
    },
  };
  return output;
};
  `;

  expect(runLoader(css)).toBe(jss.trim());
});

it(`supports multiple media queries`, () => {
  const css = `
.test {
  padding: 20px;
}

@media $(theme.breakpoints.down('sm')) {
  .test {
    padding: 10px;
  }
}

@media $(theme.breakpoints.down('xs')) {
  .test {
    padding: 5px;
  }
}
  `;

  const jss = `
module.exports = function cssToMuiLoader(theme) {
  var output = {
    test: {
      padding: '20px',
    },
  };
  output[theme.breakpoints.down('sm')] = {
    test: {
      padding: '10px',
    },
  };
  output[theme.breakpoints.down('xs')] = {
    test: {
      padding: '5px',
    },
  };
  return output;
};
  `;

  expect(runLoader(css)).toBe(jss.trim());
});

it(`throws an error on media queries that don't use Material UI`, () => {
  const css = `
.test {
  padding: 20px;
}

@media (min-width: 30em) {
  .test {
    padding: 5px;
  }
}
  `;

  expect(() => {
    runLoader(css);
  }).toThrow();
});

it(`supports pseudo-classes on base class`, () => {
  const css = `
.test {
  background: green;
  color: red;
}

.test:hover {
  background: pink;
  color: blue;
}
  `;

  const jss = `
module.exports = function cssToMuiLoader(theme) {
  return {
    test: {
      background: 'green',
      color: 'red',
      '&:hover': {
        background: 'pink',
        color: 'blue',
      },
    },
  };
};
  `;

  expect(runLoader(css)).toBe(jss.trim());
});

it(`supports pseudo-classes before base class`, () => {
  const css = `
.test:hover {
  background: pink;
  color: blue;
}

.test {
  background: green;
  color: red;
}
  `;

  const jss = `
module.exports = function cssToMuiLoader(theme) {
  return {
    test: {
      background: 'green',
      color: 'red',
      '&:hover': {
        background: 'pink',
        color: 'blue',
      },
    },
  };
};
  `;

  expect(runLoader(css)).toBe(jss.trim());
});

it(`supports pseudo-classes without base classes`, () => {
  const css = `
.test:hover {
  background: pink;
}
  `;

  const jss = `
module.exports = function cssToMuiLoader(theme) {
  return {
    test: {
      '&:hover': {
        background: 'pink',
      },
    },
  };
};
  `;

  expect(runLoader(css)).toBe(jss.trim());
});

it(`supports multiple pseudo-classeses`, () => {
  const css = `
.test:nth-child(2):hover {
  background: pink;
}
  `;

  const jss = `
module.exports = function cssToMuiLoader(theme) {
  return {
    test: {
      '&:nth-child(2):hover': {
        background: 'pink',
      },
    },
  };
};
  `;

  expect(runLoader(css)).toBe(jss.trim());
});

it(`supports multiple pseudo-classes selectors`, () => {
  const css = `
.test:hover, .test:focus {
  background: pink;
}
  `;

  const jss = `
module.exports = function cssToMuiLoader(theme) {
  return {
    test: {
      '&:hover': {
        background: 'pink',
      },
      '&:focus': {
        background: 'pink',
      },
    },
  };
};
  `;

  expect(runLoader(css)).toBe(jss.trim());
});

it(`supports pseudo-classes inside media queries`, () => {
  const css = `
.test:hover {
  background: pink;
}

@media $(theme.breakpoints.down('xs')) {
  .test:hover {
    background: pink;
  }
}
  `;

  const jss = `
module.exports = function cssToMuiLoader(theme) {
  var output = {
    test: {
      '&:hover': {
        background: 'pink',
      },
    },
  };
  output[theme.breakpoints.down('xs')] = {
    test: {
      '&:hover': {
        background: 'pink',
      },
    },
  };
  return output;
};
  `;

  expect(runLoader(css)).toBe(jss.trim());
});

it(`supports pseudo-classes on multiple class levels`, () => {
  const css = `
.test1.test2 .test3:hover {
  padding: 10px;
}
  `;

  const jss = `
module.exports = function cssToMuiLoader(theme) {
  return {
    test2: {},
    test3: {},
    test1: {
      '&$test2 $test3:hover': {
        padding: '10px',
      },
    },
  };
};
  `;

  expect(runLoader(css)).toBe(jss.trim());
});

it(`supports a single mixin with no other properties`, () => {
  const css = `
.test {
  -mui-mixins: theme.mixins.customMixin;
}
  `;

  const jss = `
module.exports = function cssToMuiLoader(theme) {
  ${OBJECT_ASSIGN_POLYFILL.trim()}
  return {
    test: cssToMuiLoaderAssign(
      {},
      theme.mixins.customMixin,
      {},
      {},
    ),
  };
};
  `;

  expect(runLoader(css)).toBe(jss.trim());
});

it(`supports a single mixin with other properties`, () => {
  const css = `
.test {
  border: 1px solid red;
  -mui-mixins: theme.mixins.customMixin;
  padding: 10px;
}
  `;

  const jss = `
module.exports = function cssToMuiLoader(theme) {
  ${OBJECT_ASSIGN_POLYFILL.trim()}
  return {
    test: cssToMuiLoaderAssign(
      {},
      theme.mixins.customMixin,
      { border: '1px solid red', padding: '10px' },
      {},
    ),
  };
};
  `;

  expect(runLoader(css)).toBe(jss.trim());
});

it(`supports multiple mixins`, () => {
  const css = `
.test {
  border: 1px solid red;
  -mui-mixins: theme.mixins.mixin1, theme.mixins.mixin2, theme.mixins.mixin3;
  padding: 10px;
}
  `;

  const jss = `
module.exports = function cssToMuiLoader(theme) {
  ${OBJECT_ASSIGN_POLYFILL.trim()}
  return {
    test: cssToMuiLoaderAssign(
      {},
      theme.mixins.mixin1,
      theme.mixins.mixin2,
      theme.mixins.mixin3,
      { border: '1px solid red', padding: '10px' },
      {},
    ),
  };
};
  `;

  expect(runLoader(css)).toBe(jss.trim());
});

it(`supports mixins on pseudo-classes with multiple class levels`, () => {
  const css = `
.test1 {
  border: 1px solid red;
  -mui-mixins: theme.mixins.customMixin1;
}

.test1 .test2:hover {
  -mui-mixins: theme.mixins.customMixin2;
  padding: 1su;
}

.test1 .test3:hover {
  -mui-mixins: theme.mixins.customMixin3;
}
  `;

  const jss = `
module.exports = function cssToMuiLoader(theme) {
  ${OBJECT_ASSIGN_POLYFILL.trim()}
  return {
    test1: cssToMuiLoaderAssign(
      {},
      theme.mixins.customMixin1,
      { border: '1px solid red' },
      {
        '& $test2:hover': cssToMuiLoaderAssign(
          {},
          theme.mixins.customMixin2,
          { padding: theme.spacing.unit * 1 + 'px' },
        ),
        '& $test3:hover': cssToMuiLoaderAssign(
          {},
          theme.mixins.customMixin3,
          {},
        ),
      },
    ),
    test2: {},
    test3: {},
  };
};
  `;

  expect(runLoader(css)).toBe(jss.trim());
});

it(`supports mixins inside media queries`, () => {
  const css = `
@media $(theme.breakpoints.down('xs')) {
  .test {
    -mui-mixins: theme.mixins.customMixin;
  }
}
  `;

  const jss = `
module.exports = function cssToMuiLoader(theme) {
  ${OBJECT_ASSIGN_POLYFILL.trim()}
  var output = {};
  output[theme.breakpoints.down('xs')] = {
    test: cssToMuiLoaderAssign(
      {},
      theme.mixins.customMixin,
      {},
      {},
    ),
  };
  return output;
};
  `;

  expect(runLoader(css)).toBe(jss.trim());
});

it(`supports mixins, properties and children inside media queries`, () => {
  const css = `
@media $(theme.breakpoints.down('xs')) {
  .test {
    -mui-mixins: theme.mixins.customMixin;
    width: 10su;
  }

  .test::after {
    background: $(theme.palette.primary.main);
    content: "we're testing";
    -mui-mixins: theme.mixins.customMixin;
  }
}
  `;

  const jss = `
module.exports = function cssToMuiLoader(theme) {
  ${OBJECT_ASSIGN_POLYFILL.trim()}
  var output = {};
  output[theme.breakpoints.down('xs')] = {
    test: cssToMuiLoaderAssign(
      {},
      theme.mixins.customMixin,
      { width: theme.spacing.unit * 10 + 'px' },
      {
        '&::after': cssToMuiLoaderAssign(
          {},
          theme.mixins.customMixin,
          {
            background: theme.palette.primary.main,
            content: '"we\\'re testing"',
          },
        ),
      },
    ),
  };
  return output;
};
  `;

  expect(runLoader(css)).toBe(jss.trim());
});

it(`supports mixins inside keyframes`, () => {
  const css = `
@keyframes my-animation {
  0% {
    -mui-mixins: theme.mixins.customMixin1;
    padding: 20px;
  }

  100% {
    -mui-mixins: theme.mixins.customMixin2;
    padding: 10px;
  }
}
  `;

  const jss = `
module.exports = function cssToMuiLoader(theme) {
  ${OBJECT_ASSIGN_POLYFILL.trim()}
  return {
    '@keyframes my-animation': {
      '0%': cssToMuiLoaderAssign({}, theme.mixins.customMixin1, {
        padding: '20px',
      }),
      '100%': cssToMuiLoaderAssign({}, theme.mixins.customMixin2, {
        padding: '10px',
      }),
    },
  };
};
  `;

  expect(runLoader(css)).toBe(jss.trim());
});
