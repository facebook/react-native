/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

var fs = require('fs');
var Promise = require('promise');
var Cache = require('./Cache');
var workerFarm = require('worker-farm');
var declareOpts = require('../lib/declareOpts');
var util = require('util');
var ModuleTransport = require('../lib/ModuleTransport');

var readFile = Promise.denodeify(fs.readFile);

module.exports = Transformer;
Transformer.TransformError = TransformError;

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
});

function Transformer(options) {
  var opts = validateOpts(options);

  this._cache = opts.nonPersistent
    ? new DummyCache()
    : new Cache({
      resetCache: options.resetCache,
      cacheVersion: options.cacheVersion,
      projectRoots: options.projectRoots,
      transformModulePath: options.transformModulePath,
    });

  if (options.transformModulePath != null) {
    this._workers = workerFarm(
      {autoStart: true, maxConcurrentCallsPerWorker: 1},
      options.transformModulePath
    );

    this._transform = Promise.denodeify(this._workers);
  }
}

Transformer.prototype.kill = function() {
  this._workers && workerFarm.end(this._workers);
  return this._cache.end();
};

Transformer.prototype.invalidateFile = function(filePath) {
  this._cache.invalidate(filePath);
};

Transformer.prototype.loadFileAndTransform = function(filePath) {
  if (this._transform == null) {
    return Promise.reject(new Error('No transfrom module'));
  }

  var transform = this._transform;
  return this._cache.get(filePath, function() {
    return readFile(filePath)
      .then(function(buffer) {
        var sourceCode = buffer.toString();

        return transform({
          sourceCode: sourceCode,
          filename: filePath,
        }).then(
          function(res) {
            if (res.error) {
              console.warn(
                'Error property on the result value form the transformer',
                'module is deprecated and will be removed in future versions.',
                'Please pass an error object as the first argument to the callback'
              );
              throw formatError(res.error, filePath);
            }

            return new ModuleTransport({
              code: res.code,
              map: res.map,
              sourcePath: filePath,
              sourceCode: sourceCode,
            });
          }
        );
      }).catch(function(err) {
        throw formatError(err, filePath);
      });
  });
};

function TransformError() {}
util.inherits(TransformError, SyntaxError);

function formatError(err, filename, source) {
  if (err.loc) {
    return formatBabelError(err, filename, source);
  } else {
    return formatGenericError(err, filename, source);
  }
}

function formatGenericError(err, filename) {
  var msg = 'TransformError: ' + filename + ': ' + err.message;
  var error = new TransformError();
  var stack = (err.stack || '').split('\n').slice(0, -1);
  stack.push(msg);
  error.stack = stack.join('\n');
  error.message = msg;
  error.type = 'TransformError';
  return error;
}

function formatBabelError(err, filename) {
  var error = new TransformError();
  error.type = 'TransformError';
  error.message = (err.type || error.type) + ' ' + err.message;
  error.stack = err.stack;
  error.snippet = err.codeFrame;
  error.lineNumber = err.loc.line;
  error.column = err.loc.column;
  error.filename = filename;
  error.description = err.message;
  return error;
}

function DummyCache() {}
DummyCache.prototype.get = function(filePath, loaderCb) {
  return loaderCb();
};
DummyCache.prototype.end =
DummyCache.prototype.invalidate = function(){};
