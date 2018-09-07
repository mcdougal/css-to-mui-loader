const cssToMuiLoader = require(`./css-to-mui-loader`);

it(`throws an error on invalid CSS syntax`, () => {
  const css = `
.test {
  padding 10px;
}
  `;

  expect(() => {
    cssToMuiLoader(css).trim();
  }).toThrow();
});

it(`works on single rule with single property`, () => {
  const css = `
.test {
  padding: 10px;
}
  `;

  const jss = `
export default (theme) => {
  return {
    test: { padding: \`10px\` },
  };
};
  `;

  expect(cssToMuiLoader(css).trim()).toBe(jss.trim());
});

it(`throws an error on non-class selectors`, () => {
  const css = `
#test {
  padding: 10px;
}
  `;

  expect(() => {
    cssToMuiLoader(css).trim();
  }).toThrow();
});

it(`works on single rule with multiple selectors`, () => {
  const css = `
.test1, .test2 {
  padding: 10px;
}
  `;

  const jss = `
export default (theme) => {
  return {
    test1: { padding: \`10px\` },
    test2: { padding: \`10px\` },
  };
};
  `;

  expect(cssToMuiLoader(css).trim()).toBe(jss.trim());
});

it(`works on single rule with multiple properties`, () => {
  const css = `
.test {
  margin: 20px;
  padding: 10px;
}
  `;

  const jss = `
export default (theme) => {
  return {
    test: { margin: \`20px\`, padding: \`10px\` },
  };
};
  `;

  expect(cssToMuiLoader(css).trim()).toBe(jss.trim());
});

it(`works on a single rule with multiple classes`, () => {
  const css = `
.test1.test2 {
  padding: 10px;
}
  `;

  const jss = `
export default (theme) => {
  return {
    test2: {},
    test1: {
      '&$test2': {
        padding: \`10px\`,
      },
    },
  };
};
  `;

  expect(cssToMuiLoader(css).trim()).toBe(jss.trim());
});

it(`works on a single rule with multiple class levels`, () => {
  const css = `
.test1 .test2 {
  padding: 10px;
}
  `;

  const jss = `
export default (theme) => {
  return {
    test2: {},
    test1: {
      '& $test2': {
        padding: \`10px\`,
      },
    },
  };
};
  `;

  expect(cssToMuiLoader(css).trim()).toBe(jss.trim());
});

it(`works on a child all selector`, () => {
  const css = `
.test1 * {
  padding: 10px;
}
  `;

  const jss = `
export default (theme) => {
  return {
    test1: {
      '& *': {
        padding: \`10px\`,
      },
    },
  };
};
  `;

  expect(cssToMuiLoader(css).trim()).toBe(jss.trim());
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
export default (theme) => {
  return {
    test: {
      alignItems: \`center\`,
      backgroundColor: \`$\{theme.palette.gray[200]}\`,
      borderLeft: \`2px solid transparent\`,
      display: \`flex\`,
      flexDirection: \`column\`,
      fontSize: \`inherit\`,
      margin: \`20px\`,
      maxWidth: \`600px\`,
      padding: \`10px\`,
      whiteSpace: \`nowrap\`,
    },
  };
};
  `;

  expect(cssToMuiLoader(css).trim()).toBe(jss.trim());
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
export default (theme) => {
  return {
    test1: { margin: \`20px\`, padding: \`10px\` },
    test2: { background: \`red\`, color: \`blue\` },
  };
};
  `;

  expect(cssToMuiLoader(css).trim()).toBe(jss.trim());
});

it(`combines declarations from the same rule defined multiple times`, () => {
  const css = `
.test {
  margin: 20px;
}

.test {
  background: red;
}
  `;

  const jss = `
export default (theme) => {
  return {
    test: { margin: \`20px\`, background: \`red\` },
  };
};
  `;

  expect(cssToMuiLoader(css).trim()).toBe(jss.trim());
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
export default (theme) => {
  return {
    test: { padding: \`10px\` },
  };
};
  `;

  expect(cssToMuiLoader(css).trim()).toBe(jss.trim());
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
export default (theme) => {
  return {
    test: { padding: \`10px\` },
  };
};
  `;

  expect(cssToMuiLoader(css).trim()).toBe(jss.trim());
});

it(`ignores inline comments`, () => {
  const css = `
.test {
  padding: 10px; /* TODO: something */
}
  `;

  const jss = `
export default (theme) => {
  return {
    test: { padding: \`10px\` },
  };
};
  `;

  expect(cssToMuiLoader(css).trim()).toBe(jss.trim());
});

it(`converts hyphens to camelCase`, () => {
  const css = `
.test {
  text-align: center;
}
  `;

  const jss = `
export default (theme) => {
  return {
    test: { textAlign: \`center\` },
  };
};
  `;

  expect(cssToMuiLoader(css).trim()).toBe(jss.trim());
});

it(`converts custom units for single positive integer value`, () => {
  const css = `
.test {
  padding: 10su;
}
  `;

  const jss = `
export default (theme) => {
  return {
    test: { padding: \`$\{theme.spacing.unit * 10}px\` },
  };
};
  `;

  expect(cssToMuiLoader(css).trim()).toBe(jss.trim());
});

it(`converts custom units for single negative integer value`, () => {
  const css = `
.test {
  padding: -10su;
}
  `;

  const jss = `
export default (theme) => {
  return {
    test: { padding: \`$\{theme.spacing.unit * -10}px\` },
  };
};
  `;

  expect(cssToMuiLoader(css).trim()).toBe(jss.trim());
});

it(`throws an error for a decimal custom unit`, () => {
  const css = `
.test {
  padding: 1.1su;
}
  `;

  expect(() => {
    cssToMuiLoader(css).trim();
  }).toThrow();
});

it(`converts custom units for multiple values`, () => {
  const css = `
.test {
  padding: 11su 12su 13su 14su;
}
  `;

  const jss = `
export default (theme) => {
  return {
    test: {
      padding: \`$\{theme.spacing.unit * 11}px $\{theme.spacing.unit *
        12}px $\{theme.spacing.unit * 13}px $\{theme.spacing.unit * 14}px\`,
    },
  };
};
  `;

  expect(cssToMuiLoader(css).trim()).toBe(jss.trim());
});

it(`converts custom units when one value is 0`, () => {
  const css = `
.test {
  padding: 0 2su;
}
  `;

  const jss = `
export default (theme) => {
  return {
    test: { padding: \`0 $\{theme.spacing.unit * 2}px\` },
  };
};
  `;

  expect(cssToMuiLoader(css).trim()).toBe(jss.trim());
});

it(`does not convert custom units when the only value is 0`, () => {
  const css = `
.test {
  padding: 0;
}
  `;

  const jss = `
export default (theme) => {
  return {
    test: { padding: \`0\` },
  };
};
  `;

  expect(cssToMuiLoader(css).trim()).toBe(jss.trim());
});

it(`supports mixing custom units with builtin units`, () => {
  const css = `
.test {
  padding: 11px 1rem 0 10su;
}
  `;

  const jss = `
export default (theme) => {
  return {
    test: { padding: \`11px 1rem 0 $\{theme.spacing.unit * 10}px\` },
  };
};
  `;

  expect(cssToMuiLoader(css).trim()).toBe(jss.trim());
});

it(`works when custom units are defined inside a transform`, () => {
  const css = `
.test {
  transform: translate(-3su);
}
  `;

  const jss = `
export default (theme) => {
  return {
    test: { transform: \`translate($\{theme.spacing.unit * -3}px)\` },
  };
};
  `;

  expect(cssToMuiLoader(css).trim()).toBe(jss.trim());
});

it(`provides an escape hatch for running JS code`, () => {
  const css = `
.test {
  color: $(theme.palette.primary.main);
}
  `;

  const jss = `
export default (theme) => {
  return {
    test: { color: \`$\{theme.palette.primary.main}\` },
  };
};
  `;

  expect(cssToMuiLoader(css).trim()).toBe(jss.trim());
});

it(`supports JS escape hatch if it's not the only thing on the line`, () => {
  const css = `
.test {
  transition: max-width $(theme.transitions.standard);
}
  `;

  const jss = `
export default (theme) => {
  return {
    test: { transition: \`max-width $\{theme.transitions.standard}\` },
  };
};
  `;

  expect(cssToMuiLoader(css).trim()).toBe(jss.trim());
});

it(`supports JS escape hatch with nested parens`, () => {
  const css = `
.test {
  border: 1px solid $(theme.utils.rgba(theme.palette.primary, .2));
}
  `;

  const jss = `
export default (theme) => {
  return {
    test: {
      border: \`1px solid $\{theme.utils.rgba(theme.palette.primary, 0.2)}\`,
    },
  };
};
  `;

  expect(cssToMuiLoader(css).trim()).toBe(jss.trim());
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
export default (theme) => {
  const myColor = \`blue\`;
  return {
    test: { background: \`$\{myColor}\` },
  };
};
  `;

  expect(cssToMuiLoader(css).trim()).toBe(jss.trim());
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
export default (theme) => {
  const commonPadding = \`$\{theme.spacing.unit * 10}px\`;
  return {
    test: { padding: \`$\{commonPadding}\` },
  };
};
  `;

  expect(cssToMuiLoader(css).trim()).toBe(jss.trim());
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
export default (theme) => {
  const myColor = \`$\{theme.palette.gray[200]}\`;
  return {
    test: { color: \`$\{myColor}\` },
  };
};
  `;

  expect(cssToMuiLoader(css).trim()).toBe(jss.trim());
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
export default (theme) => {
  const transitionProp = \`max-width\`;
  return {
    test: { transition: \`$\{transitionProp} $\{theme.transitions.standard}\` },
  };
};
  `;

  expect(cssToMuiLoader(css).trim()).toBe(jss.trim());
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
export default (theme) => {
  const myColor = \`$\{theme.palette.gray[200]}\`;
  const myPadding = \`$\{theme.spacing.unit * 2}px\`;
  return {
    test: { color: \`$\{myColor}\`, padding: \`$\{myPadding}\` },
  };
};
  `;

  expect(cssToMuiLoader(css).trim()).toBe(jss.trim());
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
export default (theme) => {
  const p = \`$\{theme.spacing.unit * 1}px\`;
  return {
    test: { padding: \`1px $\{theme.spacing.unit * 2}px $\{p} $\{theme.p}px\` },
  };
};
  `;

  expect(cssToMuiLoader(css).trim()).toBe(jss.trim());
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
export default (theme) => {
  return {
    test: { padding: \`20px\` },
    [theme.breakpoints.down('xs')]: {
      test: { padding: \`5px\` },
    },
  };
};
  `;

  expect(cssToMuiLoader(css).trim()).toBe(jss.trim());
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
export default (theme) => {
  return {
    test1: { padding: \`20px\` },
    [theme.breakpoints.down('xs')]: {
      test1: { padding: \`5px\`, margin: \`0\` },
      test2: { padding: \`10px\` },
    },
    test2: { padding: \`50px\` },
  };
};
  `;

  expect(cssToMuiLoader(css).trim()).toBe(jss.trim());
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
    cssToMuiLoader(css).trim();
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
export default (theme) => {
  return {
    test: {
      background: \`green\`,
      color: \`red\`,
      '&:hover': {
        background: \`pink\`,
        color: \`blue\`,
      },
    },
  };
};
  `;

  expect(cssToMuiLoader(css).trim()).toBe(jss.trim());
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
export default (theme) => {
  return {
    test: {
      background: \`green\`,
      color: \`red\`,
      '&:hover': {
        background: \`pink\`,
        color: \`blue\`,
      },
    },
  };
};
  `;

  expect(cssToMuiLoader(css).trim()).toBe(jss.trim());
});

it(`supports pseudo-classes without base classes`, () => {
  const css = `
.test:hover {
  background: pink;
}
  `;

  const jss = `
export default (theme) => {
  return {
    test: {
      '&:hover': {
        background: \`pink\`,
      },
    },
  };
};
  `;

  expect(cssToMuiLoader(css).trim()).toBe(jss.trim());
});

it(`supports multiple pseudo-classeses`, () => {
  const css = `
.test:nth-child(2):hover {
  background: pink;
}
  `;

  const jss = `
export default (theme) => {
  return {
    test: {
      '&:nth-child(2):hover': {
        background: \`pink\`,
      },
    },
  };
};
  `;

  expect(cssToMuiLoader(css).trim()).toBe(jss.trim());
});

it(`supports multiple pseudo-classes selectors`, () => {
  const css = `
.test:hover, .test:focus {
  background: pink;
}
  `;

  const jss = `
export default (theme) => {
  return {
    test: {
      '&:hover': {
        background: \`pink\`,
      },
      '&:focus': {
        background: \`pink\`,
      },
    },
  };
};
  `;

  expect(cssToMuiLoader(css).trim()).toBe(jss.trim());
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
export default (theme) => {
  return {
    test: {
      '&:hover': {
        background: \`pink\`,
      },
    },
    [theme.breakpoints.down('xs')]: {
      test: {
        '&:hover': {
          background: \`pink\`,
        },
      },
    },
  };
};
  `;

  expect(cssToMuiLoader(css).trim()).toBe(jss.trim());
});

it(`supports pseudo-classes on multiple class levels`, () => {
  const css = `
.test1.test2 .test3:hover {
  padding: 10px;
}
  `;

  const jss = `
export default (theme) => {
  return {
    test2: {},
    test3: {},
    test1: {
      '&$test2 $test3:hover': {
        padding: \`10px\`,
      },
    },
  };
};
  `;

  expect(cssToMuiLoader(css).trim()).toBe(jss.trim());
});

it(`supports a single mixin`, () => {
  const css = `
.test {
  border: 1px solid red;
  -mui-mixins: theme.mixins.customMixin;
  padding: 10px;
}
  `;

  const jss = `
export default (theme) => {
  return {
    test: {
      ...theme.mixins.customMixin,
      border: \`1px solid red\`,
      padding: \`10px\`,
    },
  };
};
  `;

  expect(cssToMuiLoader(css).trim()).toBe(jss.trim());
});

it(`supports a multiple mixins`, () => {
  const css = `
.test {
  border: 1px solid red;
  -mui-mixins: theme.mixins.mixin1, theme.mixins.mixin2, theme.mixins.mixin3;
  padding: 10px;
}
  `;

  const jss = `
export default (theme) => {
  return {
    test: {
      ...theme.mixins.mixin1,
      ...theme.mixins.mixin2,
      ...theme.mixins.mixin3,
      border: \`1px solid red\`,
      padding: \`10px\`,
    },
  };
};
  `;

  expect(cssToMuiLoader(css).trim()).toBe(jss.trim());
});
