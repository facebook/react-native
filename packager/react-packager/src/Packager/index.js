/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

var assert = require('assert');
var fs = require('fs');
var path = require('path');
var Promise = require('bluebird');
var Transformer = require('../JSTransformer');
var DependencyResolver = require('../DependencyResolver');
var _ = require('underscore');
var Package = require('./Package');
var Activity = require('../Activity');
var declareOpts = require('../lib/declareOpts');
var imageSize = require('image-size');

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
  transformModulePath: {
    type:'string',
    required: false,
  },
  nonPersistent: {
    type: 'boolean',
    default: false,
  },
  assetRoots: {
    type: 'array',
    required: false,
  },
  assetExts: {
    type: 'array',
    default: ['png'],
  },
  fileWatcher: {
    type: 'object',
    required: true,
  },
});

function Packager(options) {
  var opts = this._opts = validateOpts(options);

  opts.projectRoots.forEach(verifyRootExists);

  this._resolver = new DependencyResolver({
    projectRoots: opts.projectRoots,
    blacklistRE: opts.blacklistRE,
    polyfillModuleNames: opts.polyfillModuleNames,
    nonPersistent: opts.nonPersistent,
    moduleFormat: opts.moduleFormat,
    assetRoots: opts.assetRoots,
    fileWatcher: opts.fileWatcher,
  });

  this._transformer = new Transformer({
    projectRoots: opts.projectRoots,
    blacklistRE: opts.blacklistRE,
    cacheVersion: opts.cacheVersion,
    resetCache: opts.resetCache,
    transformModulePath: opts.transformModulePath,
    nonPersistent: opts.nonPersistent,
  });

  this._projectRoots = opts.projectRoots;
}

Packager.prototype.kill = function() {
  return this._transformer.kill();
};

Packager.prototype.package = function(main, runModule, sourceMapUrl, isDev) {
  var transformModule = this._transformModule.bind(this);
  var ppackage = new Package(sourceMapUrl);

  var findEventId = Activity.startEvent('find dependencies');
  var transformEventId;

  return this.getDependencies(main, isDev)
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

Packager.prototype.getDependencies = function(main, isDev) {
  return this._resolver.getDependencies(main, { dev: isDev });
};

Packager.prototype._transformModule = function(module) {
  var transform;

  if (module.isAsset_DEPRECATED) {
    transform = Promise.resolve(generateAssetModule_DEPRECATED(module));
  } else if (module.isAsset) {
    transform = generateAssetModule(
      module,
      getPathRelativeToRoot(this._projectRoots, module.path)
    );
  } else {
    transform = this._transformer.loadFileAndTransform(
      path.resolve(module.path)
    );
  }

  var resolver = this._resolver;
  return transform.then(function(transformed) {
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

function generateAssetModule_DEPRECATED(module) {
  var code = 'module.exports = ' + JSON.stringify({
    uri: module.id.replace(/^[^!]+!/, ''),
    isStatic: true,
  }) + ';';

  return {
    code: code,
    sourceCode: code,
    sourcePath: module.path,
  };
}

var sizeOf = Promise.promisify(imageSize);

function generateAssetModule(module, relPath) {
  return sizeOf(module.path).then(function(dimensions) {
    var img = {
      isStatic: true,
      path: module.path, //TODO(amasad): this should be path inside tar file.
      uri: path.join('assets', relPath),
      width: dimensions.width / module.resolution,
      height: dimensions.height / module.resolution,
    };

    var code = 'module.exports = ' + JSON.stringify(img) + ';';

    return {
      code: code,
      sourceCode: code,
      sourcePath: module.path,
    };
  });
}

function getPathRelativeToRoot(roots, absPath) {
  for (var i = 0; i < roots.length; i++) {
    var relPath = path.relative(roots[i], absPath);
    if (relPath[0] !== '.') {
      return relPath;
    }
  }

  throw new Error(
    'Expected root module to be relative to one of the project roots'
  );
}

module.exports = Packager;
