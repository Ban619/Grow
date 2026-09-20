module.exports = {
  root: true,
  env: { browser: true, es2021: true },
  extends: [ 'eslint:recommended', 'plugin:react/recommended' ],
  parserOptions: { ecmaVersion: 2021, sourceType: 'module', ecmaFeatures: { jsx: true } },
  settings: { react: { version: 'detect' } },
  rules: { 'no-console': 'warn' }
}
