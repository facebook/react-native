/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';


const path = require('path');
const Activity = require('../Activity');
const DependencyGraph = require('node-haste');
const declareOpts = require('../lib/declareOpts');
const Promise = require('promise');

const validateOpts = declareOpts({
  projectRoots: {
    type: 'array',
    required: true,
  },
  blacklistRE: {
    type: 'object', // typeof regex is object
  },
  polyfillModuleNames: {
    type: 'array',
    default: [],
  },
  moduleFormat: {
    type: 'string',
    default: 'haste',
  },
  assetRoots: {
    type: 'array',
    default: [],
  },
  fileWatcher: {
    type: 'object',
    required: true,
  },
  assetExts: {
    type: 'array',
    required: true,
  },
  cache: {
    type: 'object',
    required: true,
  },
  transformCode: {
    type: 'function',
  },
  minifyCode: {
    type: 'function',
  },
});

const getDependenciesValidateOpts = declareOpts({
  dev: {
    type: 'boolean',
    default: true,
  },
  platform: {
    type: 'string',
    required: false,
  },
  unbundle: {
    type: 'boolean',
    default: false
  },
  recursive: {
    type: 'boolean',
    default: true,
  },
});

class Resolver {

  constructor(options) {
    const opts = validateOpts(options);

    this._depGraph = new DependencyGraph({
      activity: Activity,
      roots: opts.projectRoots,
      assetRoots_DEPRECATED: opts.assetRoots,
      assetExts: opts.assetExts,
      ignoreFilePath: function(filepath) {
        return filepath.indexOf('__tests__') !== -1 ||
          (opts.blacklistRE && opts.blacklistRE.test(filepath));
      },
      providesModuleNodeModules: [
        'react',
        'react-native',
        // Parse requires AsyncStorage. They will
        // change that to require('react-native') which
        // should work after this release and we can
        // remove it from here.
        'parse',
      ],
      platforms: ['ios', 'android'],
      preferNativePlatform: true,
      fileWatcher: opts.fileWatcher,
      cache: opts.cache,
      shouldThrowOnUnresolvedErrors: (_, platform) => platform === 'ios',
      transformCode: opts.transformCode,
    });

    this._minifyCode = opts.minifyCode;
    this._polyfillModuleNames = opts.polyfillModuleNames || [];

    this._depGraph.load().catch(err => {
      console.error(err.message + '\n' + err.stack);
      process.exit(1);
    });
  }

  getShallowDependencies(entryFile) {
    return this._depGraph.getShallowDependencies(entryFile);
  }

  stat(filePath) {
    return this._depGraph.getFS().stat(filePath);
  }

  getModuleForPath(entryFile) {
    return this._depGraph.getModuleForPath(entryFile);
  }

  getDependencies(entryPath, options, transformOptions, onProgress) {
    const {platform, recursive} = getDependenciesValidateOpts(options);
    return this._depGraph.getDependencies({
      entryPath,
      platform,
      transformOptions,
      recursive,
      onProgress,
    }).then(resolutionResponse => {
      this._getPolyfillDependencies().reverse().forEach(
        polyfill => resolutionResponse.prependDependency(polyfill)
      );

      return resolutionResponse.finalize();
    });
  }

  getModuleSystemDependencies(options) {
    const opts = getDependenciesValidateOpts(options);

    const prelude = opts.dev
        ? path.join(__dirname, 'polyfills/prelude_dev.js')
        : path.join(__dirname, 'polyfills/prelude.js');

    const moduleSystem = opts.unbundle
        ? path.join(__dirname, 'polyfills/require-unbundle.js')
        : path.join(__dirname, 'polyfills/require.js');

    return [
      prelude,
      moduleSystem
    ].map(moduleName => this._depGraph.createPolyfill({
      file: moduleName,
      id: moduleName,
      dependencies: [],
    }));
  }

  _getPolyfillDependencies() {
    const polyfillModuleNames = [
      path.join(__dirname, 'polyfills/polyfills.js'),
      path.join(__dirname, 'polyfills/console.js'),
      path.join(__dirname, 'polyfills/error-guard.js'),
      path.join(__dirname, 'polyfills/String.prototype.es6.js'),
      path.join(__dirname, 'polyfills/Array.prototype.es6.js'),
      path.join(__dirname, 'polyfills/Array.es6.js'),
      path.join(__dirname, 'polyfills/Object.es7.js'),
      path.join(__dirname, 'polyfills/babelHelpers.js'),
    ].concat(this._polyfillModuleNames);

    return polyfillModuleNames.map(
      (polyfillModuleName, idx) => this._depGraph.createPolyfill({
        file: polyfillModuleName,
        id: polyfillModuleName,
        dependencies: polyfillModuleNames.slice(0, idx),
      })
    );
  }

  resolveRequires(resolutionResponse, module, code, dependencyOffsets = []) {
    return Promise.resolve().then(() => {
      const resolvedDeps = Object.create(null);
      const resolvedDepsArr = [];

      return Promise.all(
        // here, we build a map of all require strings (relative and absolute)
        // to the canonical name of the module they reference
        resolutionResponse.getResolvedDependencyPairs(module).map(
          ([depName, depModule]) => {
            if (depModule) {
              return depModule.getName().then(name => {
                resolvedDeps[depName] = name;
                resolvedDepsArr.push(name);
              });
            }
          }
        )
      ).then(() => {
        const relativizeCode = (codeMatch, quot, depName) => {
          // if we have a canonical name for the module imported here,
          // we use it, so that require() is always called with the same
          // id for every module.
          // Example:
          // -- in a/b.js:
          //    require('./c') => require('a/c');
          // -- in b/index.js:
          //    require('../a/c') => require('a/c');
          const depId = resolvedDeps[depName];
          if (depId) {
            return quot + depId + quot;
          } else {
            return codeMatch;
          }
        };

        code = dependencyOffsets.reduceRight((codeBits, offset) => {
          const first = codeBits.shift();
          codeBits.unshift(
            first.slice(0, offset),
            first.slice(offset).replace(/(['"])([^'"']*)\1/, relativizeCode),
          );
          return codeBits;
        }, [code]);

        return code.join('');
      });
    });
  }

  wrapModule({
    resolutionResponse,
    module,
    name,
    map,
    code,
    meta = {},
    minify = false
  }) {
    if (module.isJSON()) {
      code = `module.exports = ${code}`;
    }
    const result = module.isPolyfill()
      ? Promise.resolve({code: definePolyfillCode(code)})
      : this.resolveRequires(
        resolutionResponse,
        module,
        code,
        meta.dependencyOffsets
      ).then(code => ({code: defineModuleCode(name, code), map}));

    return minify
      ? result.then(({code, map}) => this._minifyCode(module.path, code, map))
      : result;
  }

  getDebugInfo() {
    return this._depGraph.getDebugInfo();
  }
}

function defineModuleCode(moduleName, code) {
  return [
    `__d(`,
    `${JSON.stringify(moduleName)}, `,
    `function(global, require, module, exports) {`,
      `${code}`,
    '\n});',
  ].join('');
}

function definePolyfillCode(code,) {
  return [
    `(function(global) {`,
    code,
    `\n})(typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : this);`,
  ].join('');
}

module.exports = Resolver;
