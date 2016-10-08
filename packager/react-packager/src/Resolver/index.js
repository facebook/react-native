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
const DependencyGraph = require('../node-haste');
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
  extraNodeModules: {
    type: 'object',
    required: false,
  },
  minifyCode: {
    type: 'function',
  },
  resetCache: {
    type: 'boolean',
    default: false,
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
        'react-native',
        'react-native-windows',
        // Parse requires AsyncStorage. They will
        // change that to require('react-native') which
        // should work after this release and we can
        // remove it from here.
        'parse',
      ],
      platforms: ['ios', 'android', 'windows', 'web'],
      preferNativePlatform: true,
      fileWatcher: opts.fileWatcher,
      cache: opts.cache,
      shouldThrowOnUnresolvedErrors: (_, platform) => platform !== 'android',
      transformCode: opts.transformCode,
      extraNodeModules: opts.extraNodeModules,
      assetDependencies: ['react-native/Libraries/Image/AssetRegistry'],
      // for jest-haste-map
      resetCache: options.resetCache,
    });

    this._minifyCode = opts.minifyCode;
    this._polyfillModuleNames = opts.polyfillModuleNames || [];

    this._depGraph.load().catch(err => {
      console.error(err.message + '\n' + err.stack);
      process.exit(1);
    });
  }

  getShallowDependencies(entryFile, transformOptions) {
    return this._depGraph.getShallowDependencies(entryFile, transformOptions);
  }

  stat(filePath) {
    return this._depGraph.getFS().stat(filePath);
  }

  getModuleForPath(entryFile) {
    return this._depGraph.getModuleForPath(entryFile);
  }

  getDependencies(entryPath, options, transformOptions, onProgress, getModuleId) {
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

      resolutionResponse.getModuleId = getModuleId;
      return resolutionResponse.finalize();
    });
  }

  getModuleSystemDependencies(options) {
    const opts = getDependenciesValidateOpts(options);

    const prelude = opts.dev
        ? path.join(__dirname, 'polyfills/prelude_dev.js')
        : path.join(__dirname, 'polyfills/prelude.js');

    const moduleSystem = path.join(__dirname, 'polyfills/require.js');

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
      path.join(__dirname, 'polyfills/Number.es6.js'),
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
    const resolvedDeps = Object.create(null);

    // here, we build a map of all require strings (relative and absolute)
    // to the canonical ID of the module they reference
    resolutionResponse.getResolvedDependencyPairs(module)
      .forEach(([depName, depModule]) => {
        if (depModule) {
          resolvedDeps[depName] = resolutionResponse.getModuleId(depModule);
        }
      });

    // if we have a canonical ID for the module imported here,
    // we use it, so that require() is always called with the same
    // id for every module.
    // Example:
    // -- in a/b.js:
    //    require('./c') => require(3);
    // -- in b/index.js:
    //    require('../a/c') => require(3);
    const replaceModuleId = (codeMatch, quote, depName) =>
      depName in resolvedDeps
        ? `${JSON.stringify(resolvedDeps[depName])} /* ${depName} */`
        : codeMatch;

    code = dependencyOffsets.reduceRight((codeBits, offset) => {
      const first = codeBits.shift();
      codeBits.unshift(
        first.slice(0, offset),
        first.slice(offset).replace(/(['"])([^'"']*)\1/, replaceModuleId),
      );
      return codeBits;
    }, [code]);

    return code.join('');
  }

  wrapModule({
    resolutionResponse,
    module,
    name,
    map,
    code,
    meta = {},
    dev = true,
    minify = false
  }) {
    if (module.isJSON()) {
      code = `module.exports = ${code}`;
    }

    if (module.isPolyfill()) {
      code = definePolyfillCode(code);
    } else {
      const moduleId = resolutionResponse.getModuleId(module);
      code = this.resolveRequires(
        resolutionResponse,
        module,
        code,
        meta.dependencyOffsets
      );
      code = defineModuleCode(moduleId, code, name, dev);
    }


    return minify
      ? this._minifyCode(module.path, code, map)
      : Promise.resolve({code, map});
  }

  minifyModule({path, code, map}) {
    return this._minifyCode(path, code, map);
  }

  getDependecyGraph() {
    return this._depGraph;
  }
}

function defineModuleCode(moduleName, code, verboseName = '', dev = true) {
  return [
    '__d(',
    `${JSON.stringify(moduleName)} /* ${verboseName} */, `,
    'function(global, require, module, exports) {',
      code,
    '\n}',
    dev ? `, ${JSON.stringify(verboseName)}` : '',
    ');',
  ].join('');
}

function definePolyfillCode(code,) {
  return [
    '(function(global) {',
    code,
    `\n})(typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : this);`,
  ].join('');
}

module.exports = Resolver;
