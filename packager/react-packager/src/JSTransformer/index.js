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
var Promise = require('bluebird');
var Cache = require('./Cache');
var workerFarm = require('worker-farm');
var declareOpts = require('../lib/declareOpts');
var util = require('util');

var readFile = Promise.promisify(fs.readFile);

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
    });

  if (options.transformModulePath == null) {
    this._failedToStart = Promise.reject(new Error('No transfrom module'));
  } else {
    this._workers = workerFarm(
      {autoStart: true, maxConcurrentCallsPerWorker: 1},
      options.transformModulePath
    );

    this._transform = Promise.promisify(this._workers);
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
  if (this._failedToStart) {
    return this._failedToStart;
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
              throw formatError(res.error, filePath, sourceCode);
            }

            return {
              code: res.code,
              sourcePath: filePath,
              sourceCode: sourceCode
            };
          }
        );
      });
  });
};

function TransformError() {}
util.inherits(TransformError, SyntaxError);

function formatError(err, filename, source) {
  if (err.lineNumber && err.column) {
    return formatEsprimaError(err, filename, source);
  } else {
    return formatGenericError(err, filename, source);
  }
}

function formatGenericError(err, filename) {
  var msg = 'TransformError: ' + filename + ': ' + err.message;
  var error = new TransformError();
  var stack = err.stack.split('\n').slice(0, -1);
  stack.push(msg);
  error.stack = stack.join('\n');
  error.message = msg;
  error.type = 'TransformError';
  return error;
}

function formatEsprimaError(err, filename, source) {
  var stack = err.stack.split('\n');
  stack.shift();

  var msg = 'TransformError: ' + err.description + ' ' +  filename + ':' +
    err.lineNumber + ':' + err.column;
  var sourceLine = source.split('\n')[err.lineNumber - 1];
  var snippet = sourceLine + '\n' + new Array(err.column - 1).join(' ') + '^';

  stack.unshift(msg);

  var error = new TransformError();
  error.message = msg;
  error.type = 'TransformError';
  error.stack = stack.join('\n');
  error.snippet = snippet;
  error.filename = filename;
  error.lineNumber = err.lineNumber;
  error.column = err.column;
  error.description = err.description;
  return error;
}

function DummyCache() {}
DummyCache.prototype.get = function(filePath, loaderCb) {
  return loaderCb();
};
DummyCache.prototype.end =
DummyCache.prototype.invalidate = function(){};
