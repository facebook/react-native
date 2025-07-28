/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @noflow
 */

'use strict';

const passthroughSyntaxPlugins = require('../passthrough-syntax-plugins');
const lazyImports = require('./lazy-imports');

const EXCLUDED_FIRST_PARTY_PATHS = [
  /[/\\]node_modules[/\\]/,
  /[/\\]packages[/\\]react-native[/\\]/,
  /[/\\]packages[/\\]virtualized-lists[/\\]/,
  /[/\\]private[/\\]react-native-fantom[/\\]/,
];

function isTypeScriptSource(fileName) {
  return !!fileName && fileName.endsWith('.ts');
}

function isTSXSource(fileName) {
  return !!fileName && fileName.endsWith('.tsx');
}

function isFirstParty(fileName) {
  return (
    !!fileName &&
    !EXCLUDED_FIRST_PARTY_PATHS.some(regex => regex.test(fileName))
  );
}

// use `this.foo = bar` instead of `this.defineProperty('foo', ...)`
const loose = true;

const getPreset = (src, options) => {
  const transformProfile =
    (options && options.unstable_transformProfile) || 'default';
  const isHermesStable = transformProfile === 'hermes-stable';
  const isHermesCanary = transformProfile === 'hermes-canary';
  const isHermes = isHermesStable || isHermesCanary;

  // We enable regenerator for !isHermes. Additionally, in dev mode we also
  // enable regenerator for the time being because Static Hermes doesn't yet
  // support debugging native generators. However, some apps have native
  // generators in release mode because it has already yielded perf wins. The
  // next release of Static Hermes will close this gap, so this won't be
  // permanent.
  const enableRegenerator = !isHermes || options.dev;

  const isNull = src == null;
  const hasClass = isNull || src.indexOf('class') !== -1;

  const extraPlugins = [];
  const firstPartyPlugins = [];

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
    // Needed for regenerator
    if (isHermes && enableRegenerator) {
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
  // This is also needed for regenerator
  if (enableRegenerator && (isNull || src.indexOf('?.') !== -1)) {
    extraPlugins.push([
      require('@babel/plugin-transform-optional-chaining'),
      {loose: true},
    ]);
  }
  // This is also needed for regenerator
  if (enableRegenerator && (isNull || src.indexOf('??') !== -1)) {
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

  if (options && options.dev && !options.disableDeepImportWarnings) {
    firstPartyPlugins.push([require('../plugin-warn-on-deep-imports.js')]);
  }

  if (options && options.dev && !options.useTransformReactJSXExperimental) {
    extraPlugins.push([require('@babel/plugin-transform-react-jsx-source')]);
    extraPlugins.push([require('@babel/plugin-transform-react-jsx-self')]);
  }

  if (isHermes && enableRegenerator) {
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
        regenerator: enableRegenerator,
        ...(isVersion && {version: options.enableBabelRuntime}),
      },
    ]);
  } else if (isHermes && enableRegenerator) {
    extraPlugins.push([require('@babel/plugin-transform-regenerator')]);
  }

  return {
    comments: false,
    compact: options.compact !== false,
    overrides: [
      // the flow strip types plugin must go BEFORE class properties!
      // there'll be a test case that fails if you don't.
      {
        plugins: [require('@babel/plugin-transform-flow-strip-types')],
      },
      {
        plugins: [
          [
            require('babel-plugin-syntax-hermes-parser'),
            {
              parseLangTypes: 'flow',
              reactRuntimeTarget: '19',
              ...options.hermesParserOptions,
            },
          ],
          [require('babel-plugin-transform-flow-enums')],
          [require('@babel/plugin-transform-block-scoping')],
          [require('@babel/plugin-transform-class-properties'), {loose}],
          [require('@babel/plugin-transform-private-methods'), {loose}],
          [
            require('@babel/plugin-transform-private-property-in-object'),
            {loose},
          ],
          [require('@babel/plugin-syntax-dynamic-import')],
          [require('@babel/plugin-syntax-export-default-from')],
          ...passthroughSyntaxPlugins,
          [require('@babel/plugin-transform-unicode-regex')],
        ],
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
        test: isFirstParty,
        plugins: firstPartyPlugins,
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
