import babel from 'rollup-plugin-babel';
import pkg from './package.json';
export default [
  // browser-friendly UMD build
  {
    input: 'index.js',
    output: {
      file: pkg.browser,
      format: 'umd',
      name: 'piwik-tracker',
    },
    plugins: [
      babel({
        exclude: ['node_modules/**']
      })
    ]
  },
  // CommonJS (for Node) and ES module (for bundlers) build.
  {
    input: 'index.js',
    external: ['ms'],
    output: [
      {file: pkg.main, format: 'cjs'},
      {file: pkg.module, format: 'es'}
    ],
    plugins: [
      babel({
        exclude: ['node_modules/**']
      })
    ]
  }
];
