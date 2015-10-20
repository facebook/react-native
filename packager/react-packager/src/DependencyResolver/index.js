/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

var path = require('path');
var DependencyGraph = require('./DependencyGraph');
var replacePatterns = require('./replacePatterns');
var Polyfill = require('./Polyfill');
var declareOpts = require('../lib/declareOpts');
var Promise = require('promise');

var validateOpts = declareOpts({
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

function HasteDependencyResolver(options) {
  var opts = validateOpts(options);

  this._depGraph = new DependencyGraph({
    roots: opts.projectRoots,
    assetRoots_DEPRECATED: opts.assetRoots,
    assetExts: opts.assetExts,
    ignoreFilePath: function(filepath) {
      return filepath.indexOf('__tests__') !== -1 ||
        (opts.blacklistRE && opts.blacklistRE.test(filepath));
    },
    fileWatcher: opts.fileWatcher,
    cache: opts.cache,
  });


  this._polyfillModuleNames = opts.polyfillModuleNames || [];
}

var getDependenciesValidateOpts = declareOpts({
  dev: {
    type: 'boolean',
    default: true,
  },
  platform: {
    type: 'string',
    required: false,
  },
});

HasteDependencyResolver.prototype.getDependencies = function(main, options) {
  var opts = getDependenciesValidateOpts(options);

  return this._depGraph.getDependencies(main, opts.platform).then(
    resolutionResponse => {
      this._getPolyfillDependencies(opts.dev).reverse().forEach(
        polyfill => resolutionResponse.prependDependency(polyfill)
      );

      return resolutionResponse.finalize();
    }
  );
};

HasteDependencyResolver.prototype._getPolyfillDependencies = function(isDev) {
  var polyfillModuleNames = [
   isDev
      ? path.join(__dirname, 'polyfills/prelude_dev.js')
      : path.join(__dirname, 'polyfills/prelude.js'),
    path.join(__dirname, 'polyfills/require.js'),
    path.join(__dirname, 'polyfills/polyfills.js'),
    path.join(__dirname, 'polyfills/console.js'),
    path.join(__dirname, 'polyfills/error-guard.js'),
    path.join(__dirname, 'polyfills/String.prototype.es6.js'),
    path.join(__dirname, 'polyfills/Array.prototype.es6.js'),
  ].concat(this._polyfillModuleNames);

  return polyfillModuleNames.map(
    (polyfillModuleName, idx) => new Polyfill({
      path: polyfillModuleName,
      id: polyfillModuleName,
      dependencies: polyfillModuleNames.slice(0, idx),
      isPolyfill: true,
    })
  );
};

HasteDependencyResolver.prototype.wrapModule = function(resolutionResponse, module, code) {
  return Promise.resolve().then(() => {
    if (module.isPolyfill()) {
      return Promise.resolve(code);
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

      return module.getName().then(
        name => defineModuleCode({
          code: code.replace(replacePatterns.IMPORT_RE, relativizeCode)
                    .replace(replacePatterns.EXPORT_RE, relativizeCode)
                    .replace(replacePatterns.REQUIRE_RE, relativizeCode),
          moduleName: name,
        })
      );
    });
  });
};

HasteDependencyResolver.prototype.getDebugInfo = function() {
  return this._depGraph.getDebugInfo();
};

function defineModuleCode({moduleName, code}) {
  return [
    `__d(`,
    `'${moduleName}',`,
    'function(global, require, module, exports) {',
    `  ${code}`,
    '\n});',
  ].join('');
}

module.exports = HasteDependencyResolver;
