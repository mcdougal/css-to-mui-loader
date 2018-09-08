module.exports = {
  env: {
    jest: true,
    es6: true,
    node: true,
  },
  extends: [`airbnb-base`, `prettier`],
  plugins: [`prettier`],
  rules: {
    'arrow-body-style': [`error`, `always`],
    'arrow-parens': [`error`, `always`],
    'func-names': `off`,
    'func-style': [`error`, `expression`, { allowArrowFunctions: true }],
    'global-require': `off`,
    'import/first': `error`,
    'import/order': [
      `error`,
      {
        'newlines-between': `always`,
        groups: [
          'builtin',
          'external',
          'internal',
          'parent',
          'sibling',
          'index',
        ],
      },
    ],
    indent: [`error`, 2, { SwitchCase: 1 }],
    'max-len': [
      `error`,
      {
        code: 80,
        ignoreUrls: true,
      },
    ],
    'no-console': `error`,
    'no-constant-condition': `off`,
    'no-continue': `off`,
    'no-param-reassign': `off`,
    'no-use-before-define': `off`,
    'no-restricted-syntax': `off`,
    'no-throw-literal': `error`,
    'object-curly-spacing': [`error`, `always`],
    'object-shorthand': `off`,
    'prefer-arrow-callback': `off`,
    'prefer-const': `error`,
    'prefer-destructuring': `off`,
    'prettier/prettier': [
      `error`,
      {
        arrowParens: `always`,
        bracketSpacing: true,
        jsxBracketSameLine: true,
        printWidth: 80,
        semi: true,
        singleQuote: true,
        tabWidth: 2,
        trailingComma: `es5`,
        useTabs: false,
      },
    ],
    quotes: [`error`, `backtick`],
    semi: `error`,
  },
};
