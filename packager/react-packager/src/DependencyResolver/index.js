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
  nonPersistent: {
    type: 'boolean',
    default: false,
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
});

HasteDependencyResolver.prototype.getDependencies = function(main, options) {
  var opts = getDependenciesValidateOpts(options);

  var depGraph = this._depGraph;
  var self = this;

  return depGraph
    .load()
    .then(() => Promise.all([
      depGraph.getOrderedDependencies(main),
      depGraph.getAsyncDependencies(main),
    ]))
    .then(
       ([dependencies, asyncDependencies]) => dependencies[0].getName().then(
         mainModuleId => {
           self._prependPolyfillDependencies(
             dependencies,
             opts.dev,
           );

           return {
             mainModuleId,
             dependencies,
             asyncDependencies,
           };
         }
       )
    );
};

HasteDependencyResolver.prototype._prependPolyfillDependencies = function(
  dependencies,
  isDev
) {
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

  var polyfillModules = polyfillModuleNames.map(
    (polyfillModuleName, idx) => new Polyfill({
      path: polyfillModuleName,
      id: polyfillModuleName,
      dependencies: polyfillModuleNames.slice(0, idx),
      isPolyfill: true,
    })
  );

  dependencies.unshift.apply(dependencies, polyfillModules);
};

HasteDependencyResolver.prototype.wrapModule = function(module, code) {
  if (module.isPolyfill()) {
    return Promise.resolve(code);
  }

  const resolvedDeps = Object.create(null);
  const resolvedDepsArr = [];

  return module.getDependencies().then(
      dependencies => Promise.all(dependencies.map(
        depName => this._depGraph.resolveDependency(module, depName)
          .then(depModule => {
            if (depModule) {
              return depModule.getName().then(name => {
                resolvedDeps[depName] = name;
                resolvedDepsArr.push(name);
              });
            }
          })
      )
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
        code: code
        .replace(replacePatterns.IMPORT_RE, relativizeCode)
        .replace(replacePatterns.REQUIRE_RE, relativizeCode),
        deps: JSON.stringify(resolvedDepsArr),
        moduleName: name,
      })
    );
  });
};

HasteDependencyResolver.prototype.getDebugInfo = function() {
  return this._depGraph.getDebugInfo();
};

function defineModuleCode({moduleName, code, deps}) {
  return [
    `__d(`,
    `'${moduleName}',`,
    `${deps},`,
    'function(global, require, module, exports) {',
    `  ${code}`,
    '\n});',
  ].join('');
}

module.exports = HasteDependencyResolver;
