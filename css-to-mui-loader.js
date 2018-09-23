const css = require(`css`);

const hyphenToCamelCase = function(s) {
  return s.replace(/-([a-z])/g, function(g) {
    return g[1].toUpperCase();
  });
};

const transpileCustomVariableName = function(variable) {
  return hyphenToCamelCase(variable.replace(/^--/, ``));
};

const transpileProperty = function(property) {
  return `'${hyphenToCamelCase(property)}'`;
};

const consumeCustomUnit = function(s) {
  const cuIndex = s.indexOf(`su`);

  if (cuIndex !== -1) {
    const part = s.slice(0, cuIndex);

    if (part.search(/^-?[\d.]+$/) !== -1) {
      if (part.indexOf(`.`) !== -1) {
        throw new Error(`Custom units cannot be fractions, received: ${part}u`);
      }

      return {
        newValue: `$\{theme.spacing.unit * ${part}}px`,
        offset: part.length + 2, // Also consume the 'su'
      };
    }
  }

  return null;
};

const consumeCssVariable = function(s) {
  if (s.startsWith(`var(`) && s.indexOf(`)`) !== -1) {
    const part = s.slice(0, s.indexOf(`)`) + 1);
    const varName = part
      .slice(4)
      .slice(0, -1)
      .trim();

    return {
      newValue: `$\{${transpileCustomVariableName(varName)}}`,
      offset: part.length,
    };
  }

  return null;
};

const consumeJsEscapeHatch = function(s) {
  if (s.startsWith(`$(`)) {
    let remaining = s.slice(2);
    let parenCount = 1;

    while (parenCount > 0 && remaining.length > 0) {
      if (remaining[0] === `)`) {
        parenCount -= 1;
      } else if (remaining[0] === `(`) {
        parenCount += 1;
      }

      remaining = remaining.slice(1);
    }

    if (parenCount === 0 || remaining.length > 0) {
      const offset = s.length - remaining.length;
      const newValue = `$\{${s.slice(2, offset - 1)}}`;

      return {
        newValue: newValue,
        offset: offset,
      };
    }
  }

  return null;
};

const transpileValue = function(value) {
  let newValue = ``;
  let remaining = value;

  const consume = function(func) {
    const result = func(remaining);

    if (result) {
      newValue += result.newValue;
      remaining = remaining.slice(result.offset);
      return true;
    }

    return false;
  };

  while (remaining.length > 0) {
    const consumeFuncs = [
      consumeCustomUnit,
      consumeCssVariable,
      consumeJsEscapeHatch,
    ];

    const success = consumeFuncs.some(consume);

    if (!success) {
      newValue += remaining[0];
      remaining = remaining.slice(1);
    }
  }

  return `\`${newValue}\``;
};

const transpileDeclarations = function(declarations) {
  const mixins = declarations.find(function(declaration) {
    return declaration.property === `-mui-mixins`;
  });

  let mixinsStr = ``;

  if (mixins) {
    mixinsStr = mixins.value
      .split(`,`)
      .map(function(mixin) {
        return `...${mixin.trim()},`;
      })
      .join(``);
  }

  const declarationsStr = declarations
    .filter(function(declaration) {
      return declaration.property !== `-mui-mixins`;
    })
    .map(function(declaration) {
      const property = transpileProperty(declaration.property);
      const value = transpileValue(declaration.value);

      return `${property}: ${value},`;
    })
    .join(``);

  return `
    ${mixinsStr}
    ${declarationsStr}
  `.trim();
};

const transpileChildClasses = function(childRules) {
  return childRules
    .map(function(childRule) {
      return `
        '&${childRule.selector.replace(/\./g, `$`)}': {
          ${transpileDeclarations(childRule.declarations)}
        },
      `.trim();
    })
    .join(``);
};

const transpileRule = function(rule) {
  if (!rule.selector.startsWith(`.`)) {
    throw new Error(
      `Only CSS class selectors are supported, received: ${rule.selector}`
    );
  }

  const selectorStr = rule.selector.replace(/^\./, ``).trim();

  const transpiled = [`'${selectorStr}': {`];

  if (rule.declarations && rule.declarations.length > 0) {
    transpiled.push(transpileDeclarations(rule.declarations));
  }

  if (rule.childRules && rule.childRules.length > 0) {
    transpiled.push(transpileChildClasses(rule.childRules));
  }

  transpiled.push(`},`);

  return transpiled.join(``);
};

const transpileMedia = function(media) {
  // Matches lines similar to: $(theme.palette.primary.main)
  const match = /^\$\((.+)\)$/.exec(media.selector.trim());

  if (!match) {
    throw new Error(
      `Invalid @media format, use Material UI breakpoints, e.g.: ` +
        `@media $(theme.breakpoints.down('xs')). Received: ${media.selector}`
    );
  }

  return `
    [${match[1]}]: {
      ${transpileRules(media.rules)}
    },
  `;
};

const transpileRules = function(rules) {
  return Object.values(rules)
    .map(function(rule) {
      if (rule.type === `media`) {
        return transpileMedia(rule);
      }

      return transpileRule(rule);
    })
    .join(``);
};

const transpileRoot = function(root) {
  if (!root) {
    return ``;
  }

  return root.declarations
    .map(function(declaration) {
      const property = transpileCustomVariableName(declaration.property);
      const value = transpileValue(declaration.value);

      return `const ${property} = ${value};`;
    })
    .join(``);
};

const transpile = function(rules) {
  const root = rules[`:root`];
  const rulesWithoutRoot = Object.assign({}, rules);
  delete rulesWithoutRoot[`:root`];

  return `
    module.exports = function cssToMuiLoader(theme) {
      ${transpileRoot(root)}
      return {
        ${transpileRules(rulesWithoutRoot)}
      };
    };
  `;
};

const mergeRules = function(rules1, rules2) {
  const newRules = Object.assign({}, rules1);

  Object.entries(rules2).forEach(function(entry) {
    const key = entry[0];
    const rule = entry[1];

    if (newRules[key]) {
      newRules[key].declarations = newRules[key].declarations.concat(
        rule.declarations
      );
    } else {
      newRules[key] = rule;
    }
  });

  return newRules;
};

/**
 * Extract rules from the given CSS AST. Return a structure that is closer
 * to the final JSS output (for example, move psuedo-classes directly under
 * the associated selectors).
 */
const parseRules = function(rules) {
  const parsedRules = {};

  const getOrCreateMedia = function(selector) {
    if (!parsedRules[selector]) {
      parsedRules[selector] = {
        type: `media`,
        selector: selector,
        rules: {},
      };
    }

    return parsedRules[selector];
  };

  const getOrCreateRule = function(selector) {
    if (!parsedRules[selector]) {
      parsedRules[selector] = {
        selector: selector,
        declarations: [],
        childRules: [],
      };
    }

    return parsedRules[selector];
  };

  rules.forEach(function(rule) {
    if (rule.type === `media`) {
      const currMedia = getOrCreateMedia(rule.media);
      currMedia.rules = mergeRules(currMedia.rules, parseRules(rule.rules));
    } else if (rule.type === `rule`) {
      const declarations = rule.declarations
        .filter(function(declaration) {
          return declaration.type === `declaration`;
        })
        .map(function(declaration) {
          return {
            property: declaration.property,
            value: declaration.value,
          };
        });

      rule.selectors.forEach(function(selector) {
        // Matches CSS class followed by anything else, for example:
        //   .test:hover
        //   .test1.test2
        //   .test1 .test2
        const childSelectorsMatch = /(\.-?[_a-zA-Z]+[_a-zA-Z0-9-]*)(.*)$/.exec(
          selector
        );

        if (childSelectorsMatch && childSelectorsMatch[2]) {
          const classSelector = childSelectorsMatch[1];
          const childSelector = childSelectorsMatch[2];

          // Matches all valid CSS classes in the child selector string
          const childClassesList = childSelector.match(
            /\.-?[_a-zA-Z]+[_a-zA-Z0-9-]*/g
          );

          if (childClassesList) {
            // Make sure a class exists for all possible child selectors
            childClassesList.forEach(function(childClass) {
              getOrCreateRule(childClass);
            });
          }

          const currRule = getOrCreateRule(classSelector);

          currRule.childRules.push({
            selector: childSelector,
            declarations: declarations,
          });
        } else {
          const currRule = getOrCreateRule(selector);
          currRule.declarations = currRule.declarations.concat(declarations);
        }
      });
    }
  });

  return parsedRules;
};

const handleSyntaxError = function(source, e) {
  const lines = source.split(`\n`).map(function(line, i) {
    return {
      text: line,
      lineNumber: i,
      isError: i === e.line - 1,
    };
  });

  const previewLines = lines.slice(
    Math.max(e.line - 4, 0),
    Math.min(e.line + 1, lines.length)
  );

  let lineNumberWidth = 0;

  previewLines.forEach(function(line) {
    lineNumberWidth = Math.max(lineNumberWidth, `${line.lineNumber}`.length);
  });

  const msg = [`SyntaxError: ${e.reason}`, ``];

  previewLines.forEach(function(line) {
    let gutter = ``;

    if (line.isError) {
      gutter += `> `;
    } else {
      gutter += `  `;
    }

    gutter += `${line.lineNumber}`.padStart(lineNumberWidth);

    msg.push(`${gutter} | ${line.text}`);

    if (line.isError) {
      const emptyGutter = ` `.repeat(2 + lineNumberWidth);
      msg.push(`${emptyGutter} | ${` `.repeat(e.column - 1)}^`);
    }
  });

  return new Error(msg.join(`\n`));
};

module.exports = function cssToMuiLoader(source) {
  let ast;

  try {
    ast = css.parse(source);
  } catch (e) {
    if (e.line) {
      throw handleSyntaxError(source, e);
    }

    throw e;
  }

  const rules = parseRules(ast.stylesheet.rules);
  const transpiled = transpile(rules);

  if (process.env.CSS_TO_MUI_TEST) {
    // Formatting makes test cases easier to understand
    return require(`prettier`).format(transpiled, {
      parser: `babylon`,
      arrowParens: `always`,
      bracketSpacing: true,
      semi: true,
      singleQuote: true,
      tabWidth: 2,
      trailingComma: `all`,
    });
  }

  return transpiled;
};
