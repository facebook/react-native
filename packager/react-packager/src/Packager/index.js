'use strict';

var assert = require('assert');
var fs = require('fs');
var path = require('path');
var q = require('q');
var Promise = require('q').Promise;
var Transformer = require('../JSTransformer');
var DependencyResolver = require('../DependencyResolver');
var _ = require('underscore');
var Package = require('./Package');
var Activity = require('../Activity');

var DEFAULT_CONFIG = {
  /**
   * RegExp used to ignore paths when scanning the filesystem to calculate the
   * dependency graph.
   */
  blacklistRE: null,

  /**
   * The kind of module system/transport wrapper to use for the modules bundled
   * in the package.
   */
  moduleFormat: 'haste',

  /**
   * An ordered list of module names that should be considered as dependencies
   * of every module in the system. The list is ordered because every item in
   * the list will have an implicit dependency on all items before it.
   *
   * (This ordering is necessary to build, for example, polyfills that build on
   *  each other)
   */
  polyfillModuleNames: [],

  nonPersistent: false,
};

function Packager(projectConfig) {
  projectConfig.projectRoots.forEach(verifyRootExists);

  this._config = Object.create(DEFAULT_CONFIG);
  for (var key in projectConfig) {
    this._config[key] = projectConfig[key];
  }

  this._resolver = new DependencyResolver(this._config);

  this._transformer = new Transformer(projectConfig);
}

Packager.prototype.kill = function() {
  return q.all([
    this._transformer.kill(),
    this._resolver.end(),
  ]);
};

Packager.prototype.package = function(main, runModule, sourceMapUrl) {
  var transformModule = this._transformModule.bind(this);
  var ppackage = new Package(sourceMapUrl);

  var findEventId = Activity.startEvent('find dependencies');
  var transformEventId;

  return this.getDependencies(main)
    .then(function(result) {
      Activity.endEvent(findEventId);
      transformEventId = Activity.startEvent('transform');

      ppackage.setMainModuleId(result.mainModuleId);
      return Promise.all(
        result.dependencies.map(transformModule)
      );
    })
    .then(function(transformedModules) {
      Activity.endEvent(transformEventId);

      transformedModules.forEach(function(transformed) {
        ppackage.addModule(
          transformed.code,
          transformed.sourceCode,
          transformed.sourcePath
        );
      });

      ppackage.finalize({ runMainModule: runModule });
      return ppackage;
    });
};

Packager.prototype.invalidateFile = function(filePath) {
  this._transformer.invalidateFile(filePath);
}

Packager.prototype.getDependencies = function(main) {
  return this._resolver.getDependencies(main);
};

Packager.prototype._transformModule = function(module) {
  var resolver = this._resolver;
  return this._transformer.loadFileAndTransform(
    ['es6'],
    path.resolve(module.path),
    this._config.transformer || {}
  ).then(function(transformed) {
    return _.extend(
      {},
      transformed,
      {code: resolver.wrapModule(module, transformed.code)}
    );
  });
};


function verifyRootExists(root) {
  // Verify that the root exists.
  assert(fs.statSync(root).isDirectory(), 'Root has to be a valid directory');
}

Packager.prototype.getGraphDebugInfo = function() {
  return this._resolver.getDebugInfo();
};


module.exports = Packager;
