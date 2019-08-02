module.exports = {
  env: {
    browser: true,
    es6: true,
    node: true,
  },
  extends: ['eslint:recommended'],
  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly',
  },
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module',
  },
  rules: {
    'array-bracket-spacing': ['error', 'always'],
    'brace-style': ['error', 'stroustrup'],
    camelcase: 'error',
    'comma-dangle': ['error', 'always-multiline'],
    'computed-property-spacing': ['error', 'always'],
    curly: 'error',
    eqeqeq: ['error', 'smart'],
    indent: [
      'error',
      2,
      {
        SwitchCase: 1,
      },
    ],
    'no-multi-spaces': 'error',
    'no-trailing-spaces': 'error',
    'no-var': 'error',
    'object-curly-spacing': ['error', 'always'],
    'prefer-const': 'error',
    quotes: [
      'error',
      'single',
      {
        allowTemplateLiterals: true,
      },
    ],
    'space-in-parens': ['error', 'always'],
  },
};
