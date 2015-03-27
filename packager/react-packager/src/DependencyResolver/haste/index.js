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
var FileWatcher = require('../../FileWatcher');
var DependencyGraph = require('./DependencyGraph');
var ModuleDescriptor = require('../ModuleDescriptor');
var declareOpts = require('../../lib/declareOpts');

var DEFINE_MODULE_CODE = [
  '__d(',
  '\'_moduleName_\',',
  '_deps_,',
  'function(global, require, requireDynamic, requireLazy, module, exports) {',
  '  _code_',
  '}',
  ');',
].join('');

var DEFINE_MODULE_REPLACE_RE = /_moduleName_|_code_|_deps_/g;
var REL_REQUIRE_STMT = /require\(['"]([\.\/0-9A-Z_$\-]*)['"]\)/gi;

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
});

function HasteDependencyResolver(options) {
  var opts = validateOpts(options);

  this._depGraph = new DependencyGraph({
    roots: opts.projectRoots,
    assetRoots: opts.assetRoots,
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

  return depGraph.load()
    .then(function() {
      var dependencies = depGraph.getOrderedDependencies(main);
      var mainModuleId = dependencies[0].id;

      self._prependPolyfillDependencies(dependencies, opts.dev);

      return {
        mainModuleId: mainModuleId,
        dependencies: dependencies
      };
    });
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
  ].concat(this._polyfillModuleNames);

  var polyfillModules = polyfillModuleNames.map(
    function(polyfillModuleName, idx) {
      return new ModuleDescriptor({
        path: polyfillModuleName,
        id: polyfillModuleName,
        dependencies: polyfillModuleNames.slice(0, idx),
        isPolyfill: true
      });
    }
  );
  dependencies.unshift.apply(dependencies, polyfillModules);
};

HasteDependencyResolver.prototype.wrapModule = function(module, code) {
  if (module.isPolyfill) {
    return code;
  }

  var resolvedDeps = Object.create(null);
  var resolvedDepsArr = [];

  for (var i = 0; i < module.dependencies.length; i++) {
    var depName = module.dependencies[i];
    var dep = this._depGraph.resolveDependency(module, depName);
    if (dep) {
      resolvedDeps[depName] = dep.id;
      resolvedDepsArr.push(dep.id);
    }
  }

  var relativizedCode =
    code.replace(REL_REQUIRE_STMT, function(codeMatch, depName) {
      var depId = resolvedDeps[depName];
      if (depId != null) {
        return 'require(\'' + depId + '\')';
      } else {
        return codeMatch;
      }
    });

  return DEFINE_MODULE_CODE.replace(DEFINE_MODULE_REPLACE_RE, function(key) {
    return {
      '_moduleName_': module.id,
      '_code_': relativizedCode,
      '_deps_': JSON.stringify(resolvedDepsArr),
    }[key];
  });
};

HasteDependencyResolver.prototype.getDebugInfo = function() {
  return this._depGraph.getDebugInfo();
};

module.exports = HasteDependencyResolver;
