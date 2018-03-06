/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
'use strict';

const resolvePlugins = require('../lib/resolvePlugins');
const resolvePlugin = resolvePlugins.resolvePlugin;

const defaultPlugins = resolvePlugins([
  'syntax-class-properties',
  'syntax-trailing-function-commas',
  'transform-class-properties',
  'transform-es2015-block-scoping',
  'transform-es2015-computed-properties',
  'transform-es2015-destructuring',
  'transform-es2015-function-name',
  'transform-es2015-literals',
  'transform-es2015-parameters',
  'transform-es2015-shorthand-properties',
  'transform-flow-strip-types',
  'transform-react-jsx',
  'transform-regenerator',
  [
    'transform-es2015-modules-commonjs',
    {strict: false, allowTopLevelThis: true},
  ],
]);

const checkES2015Constants = resolvePlugin('check-es2015-constants');
const es2015ArrowFunctions = resolvePlugin('transform-es2015-arrow-functions');
const es2015Classes = resolvePlugin('transform-es2015-classes');
const es2015ForOf = resolvePlugin(['transform-es2015-for-of', {loose: true}]);
const es2015Spread = resolvePlugin('transform-es2015-spread');
const es2015TemplateLiterals = resolvePlugin(
  'transform-es2015-template-literals'
);
const asyncFunctions = resolvePlugin('syntax-async-functions');
const exponentiationOperator = resolvePlugin(
  'transform-exponentiation-operator'
);
const objectAssign = resolvePlugin('transform-object-assign');
const objectRestSpread = resolvePlugin('transform-object-rest-spread');
const reactDisplayName = resolvePlugin('transform-react-display-name');
const reactJsxSource = resolvePlugin('transform-react-jsx-source');
const symbolMember = [require('../transforms/transform-symbol-member')];

const getPreset = (src, options) => {
  const isNull = src === null || src === undefined;
  const hasClass = isNull || src.indexOf('class') !== -1;
  const hasForOf =
    isNull || (src.indexOf('for') !== -1 && src.indexOf('of') !== -1);

  const extraPlugins = [];

  if (isNull || src.indexOf('async') !== -1 || src.indexOf('await') !== -1) {
    extraPlugins.push(asyncFunctions);
  }
  if (hasClass) {
    extraPlugins.push(es2015Classes);
  }
  if (isNull || src.indexOf('=>') !== -1) {
    extraPlugins.push(es2015ArrowFunctions);
  }
  if (isNull || src.indexOf('const') !== -1) {
    extraPlugins.push(checkES2015Constants);
  }
  if (isNull || hasClass || src.indexOf('...') !== -1) {
    extraPlugins.push(es2015Spread);
    extraPlugins.push(objectRestSpread);
  }
  if (isNull || src.indexOf('`') !== -1) {
    extraPlugins.push(es2015TemplateLiterals);
  }
  if (isNull || src.indexOf('**') !== -1) {
    extraPlugins.push(exponentiationOperator);
  }
  if (isNull || src.indexOf('Object.assign') !== -1) {
    extraPlugins.push(objectAssign);
  }
  if (hasForOf) {
    extraPlugins.push(es2015ForOf);
  }
  if (hasForOf || src.indexOf('Symbol') !== -1) {
    extraPlugins.push(symbolMember);
  }
  if (
    isNull ||
    src.indexOf('React.createClass') !== -1 ||
    src.indexOf('createReactClass') !== -1
  ) {
    extraPlugins.push(reactDisplayName);
  }

  if (options && options.dev) {
    extraPlugins.push(reactJsxSource);
  }

  return {
    comments: false,
    compact: true,
    plugins: defaultPlugins.concat(extraPlugins),
  };
};

const base = getPreset(null);
const devTools = getPreset(null, {dev: true});

module.exports = options => {
  if (options.withDevTools == null) {
    const env = process.env.BABEL_ENV || process.env.NODE_ENV;
    if (!env || env === 'development') {
      return devTools;
    }
  }
  return base;
};

module.exports.getPreset = getPreset;
