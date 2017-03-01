/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

'use strict';

const Logger = require('../Logger');

const debug = require('debug')('RNP:JStransformer');
const denodeify = require('denodeify');
const invariant = require('fbjs/lib/invariant');
const os = require('os');
const path = require('path');
const util = require('util');
const workerFarm = require('worker-farm');

import type {Data as TransformData, Options as TransformOptions} from './worker/worker';
import type {SourceMap} from '../lib/SourceMap';

// Avoid memory leaks caused in workers. This number seems to be a good enough number
// to avoid any memory leak while not slowing down initial builds.
// TODO(amasad): Once we get bundle splitting, we can drive this down a bit more.
const MAX_CALLS_PER_WORKER = 600;

// Worker will timeout if one of the callers timeout.
const TRANSFORM_TIMEOUT_INTERVAL = 301000;

// How may times can we tolerate failures from the worker.
const MAX_RETRIES = 2;

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
})(os.cpus().length, parseInt(process.env.REACT_NATIVE_MAX_WORKERS, 10));

function makeFarm(worker, methods, timeout) {
  return workerFarm(
    {
      autoStart: true,
      maxConcurrentCallsPerWorker: 1,
      maxConcurrentWorkers,
      maxCallsPerWorker: MAX_CALLS_PER_WORKER,
      maxCallTime: timeout,
      maxRetries: MAX_RETRIES,
    },
    worker,
    methods,
  );
}

class Transformer {

  _workers: {[name: string]: mixed};
  _transformModulePath: string;
  _transform: (
    transform: string,
    filename: string,
    sourceCode: string,
    options: ?TransformOptions,
  ) => Promise<TransformData>;
  minify: (
    filename: string,
    code: string,
    sourceMap: SourceMap,
  ) => Promise<{code: string, map: SourceMap}>;

  constructor(transformModulePath: string) {
    invariant(path.isAbsolute(transformModulePath), 'transform module path should be absolute');
    this._transformModulePath = transformModulePath;

    this._workers = makeFarm(
      require.resolve('./worker'),
      ['minify', 'transformAndExtractDependencies'],
      TRANSFORM_TIMEOUT_INTERVAL,
    );
    this._transform = denodeify(this._workers.transformAndExtractDependencies);
    this.minify = denodeify(this._workers.minify);
  }

  kill() {
    this._workers && workerFarm.end(this._workers);
  }

  transformFile(fileName: string, code: string, options: TransformOptions) {
    if (!this._transform) {
      return Promise.reject(new Error('No transform module'));
    }
    debug('transforming file', fileName);
    return this
      ._transform(this._transformModulePath, fileName, code, options)
      .then(data => {
        Logger.log(data.transformFileStartLogEntry);
        Logger.log(data.transformFileEndLogEntry);
        debug('done transforming file', fileName);
        return data.result;
      })
      .catch(error => {
        if (error.type === 'TimeoutError') {
          const timeoutErr = new Error(
            `TimeoutError: transforming ${fileName} took longer than ` +
            `${TRANSFORM_TIMEOUT_INTERVAL / 1000} seconds.\n` +
            'You can adjust timeout via the \'transformTimeoutInterval\' option'
          );
          /* $FlowFixMe: monkey-patch Error */
          timeoutErr.type = 'TimeoutError';
          throw timeoutErr;
        } else if (error.type === 'ProcessTerminatedError') {
          const uncaughtError = new Error(
            'Uncaught error in the transformer worker: ' +
            this._transformModulePath
          );
          /* $FlowFixMe: monkey-patch Error */
          uncaughtError.type = 'ProcessTerminatedError';
          throw uncaughtError;
        }

        throw formatError(error, fileName);
      });
  }

  static TransformError;
}

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
  error.lineNumber = 0;
  error.description = '';
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

module.exports = Transformer;
