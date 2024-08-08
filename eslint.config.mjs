import config from 'tools-config/eslint';

export default [
  ...config,
  {
    rules: {
      'import/no-unresolved': 'off',
    },
  },
];
