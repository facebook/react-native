module.exports = {
  plugins: [
    '@babel/plugin-transform-block-scoping',
    '@babel/plugin-transform-flow-strip-types',
    [
      '@babel/plugin-proposal-class-properties',
      {loose: false},
    ],
    ['@babel/plugin-transform-computed-properties'],
    ['@babel/plugin-transform-destructuring'],
    ['@babel/plugin-transform-function-name'],
    ['@babel/plugin-transform-literals'],
    ['@babel/plugin-transform-parameters'],
    ['@babel/plugin-transform-shorthand-properties'],
    ['@babel/plugin-transform-react-jsx'],
    ['@babel/plugin-transform-regenerator'],
    ['@babel/plugin-transform-runtime'],
    ['@babel/plugin-transform-sticky-regex'],
    ['@babel/plugin-transform-unicode-regex'],
    [
      '@babel/plugin-transform-modules-commonjs',
      {
        strict: false,
        strictMode: false, // prevent "use strict" injections
        allowTopLevelThis: true, // dont rewrite global `this` -> `undefined`
      },
    ],
    '@babel/plugin-transform-arrow-functions',
    '@babel/plugin-transform-classes',
    ['@babel/plugin-transform-for-of', {loose: true}],
    '@babel/plugin-transform-spread',
    [
      '@babel/plugin-transform-template-literals',
      {loose: true},
    ],
    '@babel/plugin-transform-exponentiation-operator',
    '@babel/plugin-transform-object-assign',
    '@babel/plugin-proposal-object-rest-spread',
    '@babel/plugin-proposal-optional-chaining',
    '@babel/plugin-transform-react-display-name',
  ],
};
