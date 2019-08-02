module.exports = {
  env: {
    'browser': true,
    'es6': true,
    'jest/globals': true,
    'node': true,
  },
  extends: [ 'eslint:recommended' ],
  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly',
  },
  parser: 'babel-eslint',
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module',
  },
  plugins: [ 'jest' ],
  rules: {
    'array-bracket-spacing': [ 'error', 'always' ],
    'brace-style': [ 'error', 'stroustrup' ],
    'camelcase': 'error',
    'comma-dangle': [ 'error', 'always-multiline' ],
    'computed-property-spacing': [ 'error', 'always' ],
    'curly': 'error',
    'eol-last': [ 'error', 'always' ],
    'eqeqeq': [ 'error', 'smart' ],
    'indent': [
      'error', 2,
      { SwitchCase: 1 },
    ],
    'no-multi-spaces': 'error',
    'no-trailing-spaces': 'error',
    'no-var': 'error',
    'object-curly-spacing': [ 'error', 'always' ],
    'prefer-const': 'error',
    'quote-props': [ 'error', 'consistent-as-needed' ],
    'quotes': [
      'error', 'single',
      { allowTemplateLiterals: true },
    ],
    'space-in-parens': [ 'error', 'always' ],
  },
};
