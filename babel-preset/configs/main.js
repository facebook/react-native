/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */
'use strict';

var resolvePlugins = require('../lib/resolvePlugins');

const getPreset = (src, options) => {
  const plugins = [];
  const isNull = src === null || src === undefined;
  const hasClass = isNull || src.indexOf('class') !== -1;
  const hasForOf =
    isNull || (src.indexOf('for') !== -1 && src.indexOf('of') !== -1);

  plugins.push(
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
    ]
  );

  if (isNull || src.indexOf('async') !== -1 || src.indexOf('await') !== -1) {
    plugins.push('syntax-async-functions');
  }
  if (hasClass) {
    plugins.push('transform-es2015-classes');
  }
  if (isNull || src.indexOf('=>') !== -1) {
    plugins.push('transform-es2015-arrow-functions');
  }
  if (isNull || src.indexOf('const') !== -1) {
    plugins.push('check-es2015-constants');
  }
  if (isNull || hasClass || src.indexOf('...') !== -1) {
    plugins.push('transform-es2015-spread');
    plugins.push('transform-object-rest-spread');
  }
  if (isNull || src.indexOf('`') !== -1) {
    plugins.push('transform-es2015-template-literals');
  }
  if (isNull || src.indexOf('Object.assign') !== -1) {
    plugins.push('transform-object-assign');
  }
  if (hasForOf) {
    plugins.push(['transform-es2015-for-of', {loose: true}]);
  }
  if (hasForOf || src.indexOf('Symbol') !== -1) {
    plugins.push(require('../transforms/transform-symbol-member'));
  }
  if (
    isNull ||
    src.indexOf('React.createClass') !== -1 ||
    src.indexOf('createReactClass') !== -1
  ) {
    plugins.push('transform-react-display-name');
  }
  if (isNull || src.indexOf('import(')) {
    plugins.push(require('../transforms/transform-dynamic-import'));
  }

  if (options && options.dev) {
    plugins.push('transform-react-jsx-source');
  }

  return {
    comments: false,
    compact: true,
    plugins: resolvePlugins(plugins),
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
