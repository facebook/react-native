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
var declareOpts = require('../lib/declareOpts');

var validateOpts = declareOpts({
  projectRoots: {
    type: 'array',
    required: true,
  },
  blacklistRE: {
    type: 'object', // typeof regex is object
  },
  moduleFormat: {
    type: 'string',
    default: 'haste',
  },
  polyfillModuleNames: {
    type: 'array',
    default: [],
  },
  cacheVersion: {
    type: 'string',
    default: '1.0',
  },
  resetCache: {
    type: 'boolean',
    default: false,
  },
  dev: {
    type: 'boolean',
    default: true,
  },
  transformModulePath: {
    type:'string',
    required: false,
  },
  nonPersistent: {
    type: 'boolean',
    default: false,
  },
});

function Packager(options) {
  var opts = this._opts = validateOpts(options);

  opts.projectRoots.forEach(verifyRootExists);

  this._resolver = new DependencyResolver({
    projectRoots: opts.projectRoots,
    blacklistRE: opts.blacklistRE,
    polyfillModuleNames: opts.polyfillModuleNames,
    dev: opts.dev,
    nonPersistent: opts.nonPersistent,
    moduleFormat: opts.moduleFormat
  });

  this._transformer = new Transformer({
    projectRoots: opts.projectRoots,
    blacklistRE: opts.blacklistRE,
    cacheVersion: opts.cacheVersion,
    resetCache: opts.resetCache,
    dev: opts.dev,
    transformModulePath: opts.transformModulePath,
    nonPersistent: opts.nonPersistent,
  });
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
};

Packager.prototype.getDependencies = function(main) {
  return this._resolver.getDependencies(main);
};

Packager.prototype._transformModule = function(module) {
  var resolver = this._resolver;
  return this._transformer.loadFileAndTransform(
    path.resolve(module.path)
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
