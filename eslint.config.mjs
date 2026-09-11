import config from 'tools-config/eslint/type-checked';

export default [
  ...config,
  {
    // 与 react-hooks 插件声明块的 files 对齐（不含 .mjs），否则 ESLint 10 报插件不可见
    files: ['**/*.{js,ts,jsx,tsx}'],
    rules: {
      'import-x/no-unresolved': 'off',
      // react-hooks 7 的 React Compiler 分析规则对既有异步/DOM 驱动模式偏保守，降为 warn 渐进采用
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/refs': 'warn',
      'react-hooks/immutability': 'warn',
    },
  },
  {
    ignores: ['dist/**'],
  },
];
