module.exports = {
  root: true,
  env: {
    node: true
  },
  extends: [
    'plugin:vue/essential',
    '@vue/standard'
  ],
  parserOptions: {
    parser: 'babel-eslint'
  },
  rules: {
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'indent': 'off',
    'space-before-function-paren': 'off',
    'no-trailing-spaces': 'off',
    'no-unused-vars': 'off',
    'prefer-const': 'off',
    'quote-props': 'off',
    'padded-blocks': 'off',
    'quotes': 'off',
    'no-multiple-empty-lines': 'off'
  }
}
