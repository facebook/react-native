'use strict';

var path = require('path');
var FileWatcher = require('../../FileWatcher');
var DependencyGraph = require('./DependencyGraph');
var ModuleDescriptor = require('../ModuleDescriptor');

var DEFAULT_POLYFILLS = [

];

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

function HasteDependencyResolver(config) {
  this._depGraph = new DependencyGraph({
    root: config.projectRoot,
    ignoreFilePath: function(filepath) {
      return filepath.indexOf('__tests__') !== -1 ||
        (config.blacklistRE && config.blacklistRE.test(filepath));
    },
    fileWatcher: new FileWatcher(config)
  });

  this._polyfillModuleNames = [
    config.dev
      ? path.join(__dirname, 'polyfills/prelude_dev.js')
      : path.join(__dirname, 'polyfills/prelude.js'),
    path.join(__dirname, 'polyfills/require.js'),
    path.join(__dirname, 'polyfills/polyfills.js'),
  ].concat(
    config.polyfillModuleNames || []
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

module.exports = HasteDependencyResolver;
