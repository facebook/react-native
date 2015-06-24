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
  }
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
  return depGraph.load().then(
    () => depGraph.getOrderedDependencies(main).then(
      dependencies => {
        const mainModuleId = dependencies[0].id;
        self._prependPolyfillDependencies(
          dependencies,
          opts.dev
        );

        return {
          mainModuleId: mainModuleId,
          dependencies: dependencies
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
    (polyfillModuleName, idx) => ({
      path: polyfillModuleName,
      id: polyfillModuleName,
      dependencies: polyfillModuleNames.slice(0, idx),
      isPolyfill: true,
    })
  );

  dependencies.unshift.apply(dependencies, polyfillModules);
};

HasteDependencyResolver.prototype.wrapModule = function(module, code) {
  if (module.isPolyfill) {
    return Promise.resolve(code);
  }

  const resolvedDeps = Object.create(null);
  const resolvedDepsArr = [];

  return Promise.all(
    module.dependencies.map(depName => {
      return this._depGraph.resolveDependency(module, depName)
        .then((dep) => dep && dep.getPlainObject().then(mod => {
          if (mod) {
            resolvedDeps[depName] = mod.id;
            resolvedDepsArr.push(mod.id);
          }
        }));
    })
  ).then(() => {
    const relativizeCode = (codeMatch, pre, quot, depName, post) => {
      const depId = resolvedDeps[depName];
      if (depId) {
        return pre + quot + depId + post;
      } else {
        return codeMatch;
      }
    };

    return defineModuleCode({
      code: code
        .replace(replacePatterns.IMPORT_RE, relativizeCode)
        .replace(replacePatterns.REQUIRE_RE, relativizeCode),
      deps: JSON.stringify(resolvedDepsArr),
      moduleName: module.id,
    });
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
    'function(global, require, ',
    'requireDynamic, requireLazy, module, exports) {',
    `  ${code}`,
    '\n});',
  ].join('');
}

module.exports = HasteDependencyResolver;
