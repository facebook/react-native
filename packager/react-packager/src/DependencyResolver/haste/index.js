'use strict';

var path = require('path');
var FileWatcher = require('../../FileWatcher');
var DependencyGraph = require('./DependencyGraph');
var ModuleDescriptor = require('../ModuleDescriptor');
var declareOpts = require('../../lib/declareOpts');

var DEFINE_MODULE_CODE =
  '__d(' +
    '\'_moduleName_\',' +
    '_deps_,' +
    'function(global, require, requireDynamic, requireLazy, module, exports) {'+
    '  _code_' +
    '}' +
  ');';

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
  dev: {
    type: 'boolean',
    default: true,
  },
  nonPersistent: {
    type: 'boolean',
    default: false,
  },
  moduleFormat: {
    type: 'string',
    default: 'haste',
  },
});

function HasteDependencyResolver(options) {
  var opts = validateOpts(options);

  this._fileWatcher = opts.nonPersistent
    ? FileWatcher.createDummyWatcher()
    : new FileWatcher(opts.projectRoots);

  this._depGraph = new DependencyGraph({
    roots: opts.projectRoots,
    ignoreFilePath: function(filepath) {
      return filepath.indexOf('__tests__') !== -1 ||
        (opts.blacklistRE && opts.blacklistRE.test(filepath));
    },
    fileWatcher: this._fileWatcher
  });

  this._polyfillModuleNames = [
    opts.dev
      ? path.join(__dirname, 'polyfills/prelude_dev.js')
      : path.join(__dirname, 'polyfills/prelude.js'),
    path.join(__dirname, 'polyfills/require.js'),
    path.join(__dirname, 'polyfills/polyfills.js'),
    path.join(__dirname, 'polyfills/console.js'),
    path.join(__dirname, 'polyfills/error-guard.js'),
  ].concat(
    opts.polyfillModuleNames || []
  );
}

HasteDependencyResolver.prototype.getDependencies = function(main) {
  var depGraph = this._depGraph;
  var self = this;

  return depGraph.load()
    .then(function() {
      var dependencies = depGraph.getOrderedDependencies(main);
      var mainModuleId = dependencies[0].id;

      self._prependPolyfillDependencies(dependencies);

      return {
        mainModuleId: mainModuleId,
        dependencies: dependencies
      };
    });
};

HasteDependencyResolver.prototype._prependPolyfillDependencies = function(
  dependencies
) {
  var polyfillModuleNames = this._polyfillModuleNames;
  if (polyfillModuleNames.length > 0) {
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
  }
};

HasteDependencyResolver.prototype.wrapModule = function(module, code) {
  if (module.isPolyfill) {
    return code;
  }

  var depGraph = this._depGraph;
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
      var dep = resolvedDeps[depName];
      if (dep != null) {
        return 'require(\'' + dep + '\')';
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

HasteDependencyResolver.prototype.end = function() {
  return this._fileWatcher.end();
};

HasteDependencyResolver.prototype.getDebugInfo = function() {
  return this._depGraph.getDebugInfo();
};

module.exports = HasteDependencyResolver;
