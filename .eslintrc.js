module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
    commonjs: true,
    es6: true
  },
  globals: {
    __DEV__: true
  },
  plugins: ['prettier'],
  extends: ['airbnb', 'airbnb-typescript', 'plugin:compat/recommended', 'eslint-config-prettier'],
  rules: {
    '@typescript-eslint/naming-convention': ['error', {leadingUnderscore: 'allow', format: ['camelCase', 'PascalCase', 'UPPER_CASE'], selector: 'default'}],
    '@typescript-eslint/no-use-before-define': ['error', {functions: false}],
    'prettier/prettier': 'error',
    'react/jsx-props-no-spreading': 'off',
    'react/no-unknown-property': ['error', { ignore: ['x-class', 'x-if', 'x-elseif', 'x-else'] }],
    'no-return-assign': ['error', 'except-parens'],
    'no-sequences': 'off',
    'no-shadow': 'off',
    'no-plusplus': 'off',
    'no-param-reassign': 'off',
    'no-void': 'off',
    'react/require-default-props': 'off',
    'react/react-in-jsx-scope': 'off',
    'no-use-before-define': ['error', {functions: false}],
    "import/no-extraneous-dependencies": ["error", {"devDependencies": ["{demos,test}/**/*"]}],
    'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'warn',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off'
  },
  settings: {
    'import/resolver': 'eslint-import-resolver-typescript',
    'polyfills': [
      // App which dependence this lib should pollyfill these methods:
      'Promise',
    ]
  },
  parserOptions: {
    project: './tsconfig.json'
  }
};
