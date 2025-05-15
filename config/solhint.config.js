module.exports = {
  extends: 'solhint:recommended',
  plugins: [],
  rules: {
    'code-complexity': ['warn', 7],
    'compiler-version': ['error', '^0.8.20'],
    'const-name-snakecase': 'off',
    'constructor-syntax': 'error',
    'func-visibility': ['warn', { ignoreConstructors: true }],
    'max-line-length': ['warn', 120],
    'not-rely-on-time': 'off',
    'reason-string': ['warn', { maxLength: 64 }],
    'var-name-mixedcase': 'off',
    'func-name-mixedcase': 'off',
    'private-vars-leading-underscore': 'off',
  }
}; 