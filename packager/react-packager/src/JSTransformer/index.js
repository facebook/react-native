/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

const Activity = require('../Activity');
const Promise = require('promise');
const declareOpts = require('../lib/declareOpts');
const os = require('os');
const util = require('util');
const workerFarm = require('worker-farm');
const debug = require('debug')('ReactNativePackager:JStransformer');

// Avoid memory leaks caused in workers. This number seems to be a good enough number
// to avoid any memory leak while not slowing down initial builds.
// TODO(amasad): Once we get bundle splitting, we can drive this down a bit more.
const MAX_CALLS_PER_WORKER = 600;

// Worker will timeout if one of the callers timeout.
const DEFAULT_MAX_CALL_TIME = 301000;

// How may times can we tolerate failures from the worker.
const MAX_RETRIES = 2;

const validateOpts = declareOpts({
  transformModulePath: {
    type:'string',
    required: false,
  },
  transformTimeoutInterval: {
    type: 'number',
    default: DEFAULT_MAX_CALL_TIME,
  },
  worker: {
    type: 'string',
  },
  methods: {
    type: 'array',
    default: [],
  },
});

const maxConcurrentWorkers = ((cores, override) => {
  if (override) {
    return Math.min(cores, override);
  }

  if (cores < 3) {
    return cores;
  }
  if (cores < 8) {
    return Math.floor(cores * 0.75);
  }
  if (cores < 24) {
    return Math.floor(3 / 8 * cores + 3); // between cores *.75 and cores / 2
  }
  return cores / 2;
})(os.cpus().length, process.env.REACT_NATIVE_MAX_WORKERS);

function makeFarm(worker, methods, timeout) {
  return workerFarm(
    {
      autoStart: true,
      maxConcurrentCallsPerWorker: 1,
      maxConcurrentWorkers: maxConcurrentWorkers,
      maxCallsPerWorker: MAX_CALLS_PER_WORKER,
      maxCallTime: timeout,
      maxRetries: MAX_RETRIES,
    },
    worker,
    methods,
  );
}

class Transformer {
  constructor(options) {
    const opts = this._opts = validateOpts(options);

    const {transformModulePath} = opts;

    if (opts.worker) {
      this._workers =
        makeFarm(opts.worker, opts.methods, opts.transformTimeoutInterval);
      opts.methods.forEach(name => {
        this[name] = this._workers[name];
      });
    }
    else if (transformModulePath) {
      this._transformModulePath = require.resolve(transformModulePath);

      this._workers = makeFarm(
        require.resolve('./worker'),
        ['minify', 'transformAndExtractDependencies'],
        opts.transformTimeoutInterval,
      );
      this._transform = Promise.denodeify(this._workers.transformAndExtractDependencies);
      this.minify = Promise.denodeify(this._workers.minify);
    }
  }

  kill() {
    this._workers && workerFarm.end(this._workers);
  }

  transformFile(fileName, code, options) {
    if (!this._transform) {
      return Promise.reject(new Error('No transform module'));
    }
    debug('transforming file', fileName);
    const transformEventId = Activity.startEvent(
      'Transforming file',
      fileName,
      {
        telemetric: true,
        silent: true,
      },
    );
    return this
      ._transform(this._transformModulePath, fileName, code, options)
      .then(result => {
        debug('done transforming file', fileName);
        Activity.endEvent(transformEventId);
        return result;
      })
      .catch(error => {
        if (error.type === 'TimeoutError') {
          const timeoutErr = new Error(
            `TimeoutError: transforming ${fileName} took longer than ` +
            `${this._opts.transformTimeoutInterval / 1000} seconds.\n` +
            'You can adjust timeout via the \'transformTimeoutInterval\' option'
          );
          timeoutErr.type = 'TimeoutError';
          throw timeoutErr;
        } else if (error.type === 'ProcessTerminatedError') {
          const uncaughtError = new Error(
            'Uncaught error in the transformer worker: ' +
            this._opts.transformModulePath
          );
          uncaughtError.type = 'ProcessTerminatedError';
          throw uncaughtError;
        }

        throw formatError(error, fileName);
      });
  }
}

module.exports = Transformer;

Transformer.TransformError = TransformError;

function TransformError() {
  Error.captureStackTrace && Error.captureStackTrace(this, TransformError);
}
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
