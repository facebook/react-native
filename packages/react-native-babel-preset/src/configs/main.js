/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @oncall react_native
 */

'use strict';

const passthroughSyntaxPlugins = require('../passthrough-syntax-plugins');
const lazyImports = require('./lazy-imports');

function isTypeScriptSource(fileName) {
  return !!fileName && fileName.endsWith('.ts');
}

function isTSXSource(fileName) {
  return !!fileName && fileName.endsWith('.tsx');
}

// use `this.foo = bar` instead of `this.defineProperty('foo', ...)`
const loose = true;

const defaultPlugins = [
  [require('babel-plugin-syntax-hermes-parser'), {parseLangTypes: 'flow'}],
  [require('babel-plugin-transform-flow-enums')],
  [require('@babel/plugin-transform-block-scoping')],
  [require('@babel/plugin-transform-class-properties'), {loose}],
  [require('@babel/plugin-transform-private-methods'), {loose}],
  [require('@babel/plugin-transform-private-property-in-object'), {loose}],
  [require('@babel/plugin-syntax-dynamic-import')],
  [require('@babel/plugin-syntax-export-default-from')],
  ...passthroughSyntaxPlugins,
  [require('@babel/plugin-transform-unicode-regex')],
];

// For Static Hermes testing (experimental), the hermes-canary transformProfile
// is used to enable regenerator (and some related lowering passes) because SH
// requires more Babel lowering than Hermes temporarily.
const getPreset = (src, options) => {
  const transformProfile =
    (options && options.unstable_transformProfile) || 'default';
  const isHermesStable = transformProfile === 'hermes-stable';
  const isHermesCanary = transformProfile === 'hermes-canary';
  const isHermes = isHermesStable || isHermesCanary;

  const isNull = src == null;
  const hasClass = isNull || src.indexOf('class') !== -1;

  const extraPlugins = [];
  if (!options.useTransformReactJSXExperimental) {
    extraPlugins.push([
      require('@babel/plugin-transform-react-jsx'),
      {runtime: 'automatic'},
    ]);
  }

  if (
    !options.disableStaticViewConfigsCodegen &&
    (src === null || /\bcodegenNativeComponent</.test(src))
  ) {
    extraPlugins.push([require('@react-native/babel-plugin-codegen')]);
  }

  if (!options || !options.disableImportExportTransform) {
    extraPlugins.push(
      [require('@babel/plugin-proposal-export-default-from')],
      [
        require('@babel/plugin-transform-modules-commonjs'),
        {
          strict: false,
          strictMode: false, // prevent "use strict" injections
          lazy:
            options && options.lazyImportExportTransform != null
              ? options.lazyImportExportTransform
              : importSpecifier => lazyImports.has(importSpecifier),
          allowTopLevelThis: true, // dont rewrite global `this` -> `undefined`
        },
      ],
    );
  }

  if (hasClass) {
    extraPlugins.push([require('@babel/plugin-transform-classes')]);
  }

  if (!isHermes && (isNull || src.includes('=>'))) {
    extraPlugins.push([require('@babel/plugin-transform-arrow-functions')]);
  }

  if (!isHermes) {
    extraPlugins.push([require('@babel/plugin-transform-computed-properties')]);
    extraPlugins.push([require('@babel/plugin-transform-parameters')]);
    extraPlugins.push([
      require('@babel/plugin-transform-shorthand-properties'),
    ]);
    extraPlugins.push([
      require('@babel/plugin-transform-optional-catch-binding'),
    ]);
    extraPlugins.push([require('@babel/plugin-transform-function-name')]);
    extraPlugins.push([require('@babel/plugin-transform-literals')]);
    extraPlugins.push([require('@babel/plugin-transform-numeric-separator')]);
    extraPlugins.push([require('@babel/plugin-transform-sticky-regex')]);
  } else {
    extraPlugins.push([
      require('@babel/plugin-transform-named-capturing-groups-regex'),
    ]);
    // Needed for regenerator for hermes-canary
    if (isHermesCanary) {
      extraPlugins.push([
        require('@babel/plugin-transform-optional-catch-binding'),
      ]);
    }
  }
  extraPlugins.push([
    require('@babel/plugin-transform-destructuring'),
    {useBuiltIns: true},
  ]);
  if (!isHermes && (isNull || hasClass || src.indexOf('...') !== -1)) {
    extraPlugins.push(
      [require('@babel/plugin-transform-spread')],
      [
        require('@babel/plugin-transform-object-rest-spread'),
        // Assume no dependence on getters or evaluation order. See https://github.com/babel/babel/pull/11520
        {loose: true, useBuiltIns: true},
      ],
    );
  }
  if (isNull || src.indexOf('async') !== -1) {
    extraPlugins.push([
      require('@babel/plugin-transform-async-generator-functions'),
    ]);
    extraPlugins.push([require('@babel/plugin-transform-async-to-generator')]);
  }
  if (
    isNull ||
    src.indexOf('React.createClass') !== -1 ||
    src.indexOf('createReactClass') !== -1
  ) {
    extraPlugins.push([require('@babel/plugin-transform-react-display-name')]);
  }
  // Check !isHermesStable because this is needed for regenerator for
  // hermes-canary
  if (!isHermesStable && (isNull || src.indexOf('?.') !== -1)) {
    extraPlugins.push([
      require('@babel/plugin-transform-optional-chaining'),
      {loose: true},
    ]);
  }
  // Check !isHermesStable because this is needed for regenerator for
  // hermes-canary
  if (!isHermesStable && (isNull || src.indexOf('??') !== -1)) {
    extraPlugins.push([
      require('@babel/plugin-transform-nullish-coalescing-operator'),
      {loose: true},
    ]);
  }
  if (
    !isHermes &&
    (isNull ||
      src.indexOf('??=') !== -1 ||
      src.indexOf('||=') !== -1 ||
      src.indexOf('&&=') !== -1)
  ) {
    extraPlugins.push([
      require('@babel/plugin-transform-logical-assignment-operators'),
      {loose: true},
    ]);
  }

  if (options && options.dev && !options.useTransformReactJSXExperimental) {
    extraPlugins.push([require('@babel/plugin-transform-react-jsx-source')]);
    extraPlugins.push([require('@babel/plugin-transform-react-jsx-self')]);
  }

  if (isHermesCanary) {
    const hasForOf =
      isNull || (src.indexOf('for') !== -1 && src.indexOf('of') !== -1);
    if (hasForOf) {
      // Needed for regenerator
      extraPlugins.push([
        require('@babel/plugin-transform-for-of'),
        {loose: true},
      ]);
    }
  }

  if (!options || options.enableBabelRuntime !== false) {
    // Allows configuring a specific runtime version to optimize output
    const isVersion = typeof options?.enableBabelRuntime === 'string';

    extraPlugins.push([
      require('@babel/plugin-transform-runtime'),
      {
        helpers: true,
        regenerator: !isHermesStable,
        ...(isVersion && {version: options.enableBabelRuntime}),
      },
    ]);
  } else if (isHermesCanary) {
    extraPlugins.push([require('@babel/plugin-transform-regenerator')]);
  }

  return {
    comments: false,
    compact: true,
    overrides: [
      // the flow strip types plugin must go BEFORE class properties!
      // there'll be a test case that fails if you don't.
      {
        plugins: [require('@babel/plugin-transform-flow-strip-types')],
      },
      {
        plugins: defaultPlugins,
      },
      {
        test: isTypeScriptSource,
        plugins: [
          [
            require('@babel/plugin-transform-typescript'),
            {
              isTSX: false,
              allowNamespaces: true,
            },
          ],
        ],
      },
      {
        test: isTSXSource,
        plugins: [
          [
            require('@babel/plugin-transform-typescript'),
            {
              isTSX: true,
              allowNamespaces: true,
            },
          ],
        ],
      },
      {
        plugins: extraPlugins,
      },
    ],
  };
};

module.exports = options => {
  if (options.withDevTools == null) {
    const env = process.env.BABEL_ENV || process.env.NODE_ENV;
    if (!env || env === 'development') {
      return getPreset(null, {...options, dev: true});
    }
  }
  return getPreset(null, options);
};

module.exports.getPreset = getPreset;
