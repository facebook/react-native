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
const DependencyGraph = require('../DependencyResolver/DependencyGraph');
const replacePatterns = require('../DependencyResolver/lib/replacePatterns');
const Polyfill = require('../DependencyResolver/Polyfill');
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
  isUnbundle: {
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
        'fbjs',
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
    });

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

  getDependencies(main, options) {
    const opts = getDependenciesValidateOpts(options);

    return this._depGraph.getDependencies(
      main,
      opts.platform,
      opts.recursive,
    ).then(resolutionResponse => {
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

    const moduleSystem = opts.isUnbundle
        ? path.join(__dirname, 'polyfills/require-unbundle.js')
        : path.join(__dirname, 'polyfills/require.js');

    return [
      prelude,
      moduleSystem
    ].map(moduleName => new Polyfill({
      path: moduleName,
      id: moduleName,
      dependencies: [],
      isPolyfill: true,
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
      (polyfillModuleName, idx) => new Polyfill({
        path: polyfillModuleName,
        id: polyfillModuleName,
        dependencies: polyfillModuleNames.slice(0, idx),
        isPolyfill: true,
      })
    );
  }

  resolveRequires(resolutionResponse, module, code) {
    return Promise.resolve().then(() => {
      if (module.isPolyfill()) {
        return Promise.resolve({code});
      }

      const resolvedDeps = Object.create(null);
      const resolvedDepsArr = [];

      return Promise.all(
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
        const relativizeCode = (codeMatch, pre, quot, depName, post) => {
          const depId = resolvedDeps[depName];
          if (depId) {
            return pre + quot + depId + post;
          } else {
            return codeMatch;
          }
        };

        code = code
          .replace(replacePatterns.IMPORT_RE, relativizeCode)
          .replace(replacePatterns.EXPORT_RE, relativizeCode)
          .replace(replacePatterns.REQUIRE_RE, relativizeCode);

        return module.getName().then(name => {
          return {name, code};
        });
      });
    });
  }

  wrapModule(resolutionResponse, module, code) {
    if (module.isPolyfill()) {
      return Promise.resolve({
        code: definePolyfillCode(code),
      });
    }

    return this.resolveRequires(resolutionResponse, module, code).then(
      ({name, code}) => {
        return {name, code: defineModuleCode(name, code)};
      });
  }

  getDebugInfo() {
    return this._depGraph.getDebugInfo();
  }

}

function defineModuleCode(moduleName, code) {
  return [
    `__d(`,
    `'${moduleName}',`,
    'function(global, require, module, exports) {',
    `  ${code}`,
    '\n});',
  ].join('');
}

function definePolyfillCode(code) {
  return [
    '(function(global) {',
    code,
    `\n})(typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : this);`,
  ].join('');
}

module.exports = Resolver;
