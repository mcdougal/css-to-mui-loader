const css = require(`css`);

/**
 * Object.assign polyfill, used to merge mixins with css rules. Taken from:
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign#Polyfill
 */
const OBJECT_ASSIGN_POLYFILL = `
  function cssToMuiLoaderAssign(target, varArgs) { // .length of function is 2
    'use strict';
    if (target == null) { // TypeError if undefined or null
      throw new TypeError('Cannot convert undefined or null to object');
    }

    var to = Object(target);

    for (var index = 1; index < arguments.length; index++) {
      var nextSource = arguments[index];

      if (nextSource != null) { // Skip over if undefined or null
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

/**
 * CSS properties need to be converted to camelCase to work with JSS. We also
 * may need to convert user-defined variables to camelCase so they can be used
 * as JavaScript variables.
 */
const hyphenToCamelCase = function(s) {
  return s.replace(/-([a-z])/g, function(g) {
    return g[1].toUpperCase();
  });
};

/**
 * Convert a custom CSS variable name into a valid JavaScript variable name.
 */
const transpileCustomVariableName = function(variable) {
  return hyphenToCamelCase(variable.replace(/^--/, ``));
};

/**
 * Convert a CSS property (e.g. background-color) into its JSS equivalent
 * (e.g. backgroundColor).
 */
const transpileProperty = function(property) {
  return hyphenToCamelCase(property);
};

/**
 * If the given string starts with a Material UI "spacing unit" value
 * (e.g. 10su), return a transpiled version of the unit and the number of
 * characters used by the value in the original string.
 *
 * Example: The string '10su 5su' will parse the '10su' and return:
 * {
 *   newValue: `theme.spacing(10) + 'px'`,
 *   offset: 4, // # of chars in '10su'
 * }
 */
const consumeCustomUnit = function(s) {
  const cuIndex = s.indexOf(`su`);

  if (cuIndex !== -1) {
    const value = s.slice(0, cuIndex);

    if (value.search(/^-?[\d.]+$/) !== -1) {
      if (value.indexOf(`.`) !== -1) {
        throw new Error(
          `Custom units cannot be fractions, received: ${value}su`
        );
      }

      return {
        newValue: `theme.spacing(${value}) + 'px'`,
        offset: value.length + 2, // Also consume the 'su'
      };
    }
  }

  return null;
};

/**
 * If the given string starts with a CSS variable (e.g. var(--my-var)), return
 * a transpiled variable name and the number of characters used by the variable
 * in the original string.
 *
 * Example: The string 'var(--my-var) .2s ease-in-out' will parse the
 * 'var(--my-var)' and return:
 * {
 *   newValue: myVar,
 *   offset: 13, // # of chars in 'var(--my-var)'
 * }
 */
const consumeCssVariable = function(s) {
  if (s.startsWith(`var(`) && s.indexOf(`)`) !== -1) {
    const part = s.slice(0, s.indexOf(`)`) + 1);
    const varName = part.slice(4).slice(0, -1);

    return {
      newValue: transpileCustomVariableName(varName),
      offset: part.length,
    };
  }

  return null;
};

/**
 * If the given string starts with a JavaScript "escape hatch"
 * (e.g. $(theme.palette.colors.white)), return a transpiled version of the
 * JavaScript and the number of characters used by the JS code in the original
 * string.
 *
 * Example: The string '$(theme.palette.colors.white)' will return:
 * {
 *   newValue: theme.palette.colors.white,
 *   offset: 29, // # of chars in '$(theme.palette.colors.white)'
 * }
 */
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
      const newValue = s.slice(2, offset - 1);

      return {
        newValue: newValue,
        offset: offset,
      };
    }
  }

  return null;
};

/**
 * Convert any CSS value into a string of equivalent JS code.
 */
const transpileValue = function(value) {
  const newValue = [];
  let remaining = value;
  let currStr = ``;

  while (remaining.length > 0) {
    let result = consumeCustomUnit(remaining);

    if (!result) {
      result = consumeCssVariable(remaining);
    }

    if (!result) {
      result = consumeJsEscapeHatch(remaining);
    }

    if (!result) {
      // Consume another character
      currStr += remaining[0];
      remaining = remaining.slice(1);
    } else {
      // Add the current string to the new value array
      if (currStr) {
        const safeStr = currStr.replace(/'/g, `\\'`).replace(/\n/g, ` `);
        newValue.push(`'${safeStr}'`);
        currStr = ``;
      }

      // Add the consumed value to the new value array
      newValue.push(result.newValue);
      remaining = remaining.slice(result.offset);
    }
  }

  if (currStr) {
    const safeStr = currStr.replace(/'/g, `\\'`).replace(/\n/g, ` `);
    newValue.push(`'${safeStr}'`);
  }

  return newValue.join(`+`);
};

const transpileDeclarations = function(declarations) {
  const mixins = declarations.find(function(declaration) {
    return declaration.property === `-mui-mixins`;
  });

  let mixinsStr = null;

  if (mixins) {
    mixinsStr = mixins.value
      .split(`,`)
      .map(function(mixin) {
        return `${mixin},`;
      })
      .join(``);
  }

  const declarationsStr = declarations
    .filter(function(declaration) {
      return declaration.property && declaration.property !== `-mui-mixins`;
    })
    .map(function(declaration) {
      const property = transpileProperty(declaration.property);
      const value = transpileValue(declaration.value);

      return `'${property}': ${value},`;
    })
    .join(``);

  let transpiledDeclarations;

  if (mixinsStr) {
    transpiledDeclarations = `
      ${mixinsStr}
      { ${declarationsStr} },
    `;
  } else {
    transpiledDeclarations = declarationsStr;
  }

  return {
    declarations: transpiledDeclarations,
    usesMixins: Boolean(mixinsStr),
  };
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

const transpileChildClasses = function(childRules) {
  return childRules
    .map(function(childRule) {
      const { declarations, usesMixins } = transpileDeclarations(
        childRule.declarations
      );

      const selector = `'&${childRule.selector.replace(/\./g, `$`)}'`;

      if (usesMixins) {
        return `
          ${selector}: cssToMuiLoaderAssign(
            {},
            ${declarations}
          ),
        `;
      }

      return `
        ${selector}: {
          ${declarations}
        },
      `;
    })
    .join(``);
};

/**
 * Return a string of JavaScript code that presents the given keyframes
 * rule as an entry in a JavaScript object.
 */
const transpileKeyframes = function(keyframes) {
  const transpiledKeyframes = keyframes.keyframes.map(function(keyframe) {
    const { declarations, usesMixins } = transpileDeclarations(
      keyframe.declarations
    );

    const selector = `'${keyframe.values.join(`,`)}'`;

    if (usesMixins) {
      return `${selector}: cssToMuiLoaderAssign({}, ${declarations}),`;
    }

    return `${selector}: { ${declarations} },`;
  });

  return `
    '@${keyframes.vendor || ``}keyframes ${keyframes.name}': {
      ${transpiledKeyframes.join(``)}
    },
  `;
};

/**
 * Return a string of JavaScript code that presents the given CSS rule
 * as an entry in a JavaScript object.
 */
const transpileRule = function(rule) {
  if (!rule.selector.startsWith(`.`)) {
    throw new Error(
      `Only CSS class selectors are supported, received: ${rule.selector}`
    );
  }

  let declarations = ``;
  let childClasses = ``;
  let usesMixins = false;

  if (rule.declarations && rule.declarations.length > 0) {
    ({ declarations, usesMixins } = transpileDeclarations(rule.declarations));
  }

  if (rule.childRules && rule.childRules.length > 0) {
    childClasses = transpileChildClasses(rule.childRules);
  }

  const selector = `'${rule.selector.replace(/^\./, ``)}'`;

  if (usesMixins) {
    return `
      ${selector}: cssToMuiLoaderAssign(
        {},
        ${declarations}
        { ${childClasses} }
      ),
    `;
  }

  return `
    ${selector}: {
      ${declarations}
      ${childClasses}
    },
  `;
};

/**
 * Return a string of JavaScript code that presents the given media query
 * rule as an entry in a JavaScript object.
 */
const transpileMedia = function(media) {
  // Matches lines similar to: $(theme.palette.primary.main)
  const match = /^\$\((.+)\)$/.exec(media.selector);

  if (!match) {
    throw new Error(
      `Invalid @media format, use Material UI breakpoints, e.g.: ` +
        `@media $(theme.breakpoints.down('xs')). Received: ${media.selector}`
    );
  }

  const transpiledRules = Object.values(media.rules).map(transpileRule);

  return `
    output[${match[1]}] = {
      ${transpiledRules.join(``)}
    };
  `;
};

/**
 * Return a string of JavaScript code that presents the given CSS rules
 * as a Material UI JSS function.
 */
const transpile = function(rules, mediaQueries, keyframes) {
  const root = rules[`:root`];
  const rulesWithoutRoot = Object.assign({}, rules);
  delete rulesWithoutRoot[`:root`];

  const transpiledKeyframes = Object.values(keyframes).map(transpileKeyframes);
  const transpiledRules = Object.values(rulesWithoutRoot).map(transpileRule);
  const transpiledMedia = Object.values(mediaQueries).map(transpileMedia);

  let transpiledCss;

  if (transpiledMedia.length > 0) {
    transpiledCss = `
      ${transpileRoot(root)}
      var output = {
        ${transpiledKeyframes.join(``)}
        ${transpiledRules.join(``)}
      };

      ${transpiledMedia.join(``)}

      return output;
    `;
  } else {
    transpiledCss = `
      ${transpileRoot(root)}
      return {
        ${transpiledKeyframes.join(``)}
        ${transpiledRules.join(``)}
      };
    `;
  }

  let objectAssignPolyfill = ``;

  if (transpiledCss.includes(`cssToMuiLoaderAssign`)) {
    objectAssignPolyfill = OBJECT_ASSIGN_POLYFILL;
  }

  return `
    module.exports = function cssToMuiLoader(theme) {
      ${objectAssignPolyfill}
      ${transpiledCss}
    };
  `;
};

/**
 * Extract the rules from the source CSS AST. Return a structure that
 * is closer to the final JSS output (for example, make psuedo-classes
 * child rules of their associated parent selectors).
 */
const parseRules = function(rules) {
  const parsedRules = {};

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
    if (rule.type === `rule`) {
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

/**
 * Extract the media queries from the source CSS AST. Merge the child rules
 * of media queries with the same names.
 */
const parseMediaQueries = function(rules) {
  const parsedMedia = {};

  rules.forEach(function(rule) {
    if (rule.type === `media`) {
      if (!parsedMedia[rule.media]) {
        parsedMedia[rule.media] = {
          selector: rule.media,
          rules: {},
        };
      }

      const currMedia = parsedMedia[rule.media];

      // Parse the child rules and merge them with the existing rules
      Object.entries(parseRules(rule.rules)).forEach(function(entry) {
        const selector = entry[0];
        const newRule = entry[1];
        const currRule = currMedia.rules[selector];

        if (currRule) {
          currRule.declarations = currRule.declarations.concat(
            newRule.declarations
          );
        } else {
          currMedia.rules[selector] = newRule;
        }
      });
    }
  });

  return parsedMedia;
};

/**
 * Extract the keyframes from the source CSS AST. If there are multiple
 * keyframes with the same name, the last one is used.
 */
const parseKeyframes = function(rules) {
  const parsedKeyframes = {};

  rules.forEach(function(rule) {
    if (rule.type === `keyframes`) {
      parsedKeyframes[rule.name] = rule;
    }
  });

  return parsedKeyframes;
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
  const mediaQueries = parseMediaQueries(ast.stylesheet.rules);
  const keyframes = parseKeyframes(ast.stylesheet.rules);

  return transpile(rules, mediaQueries, keyframes);
};
