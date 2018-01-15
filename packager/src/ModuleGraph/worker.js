/**
 * Copyright (c) 2016-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */
'use strict';

const asyncify: Asyncify = require('async/asyncify');
const optimizeModule = require('./worker/optimize-module');
const transformModule = require('./worker/transform-module');
const wrapWorkerFn = require('./worker/wrap-worker-fn');

import type {Callback} from './types.flow';
import type {OptimizationOptions} from './worker/optimize-module';
import type {TransformOptions} from './worker/transform-module';
import type {WorkerFnWithIO} from './worker/wrap-worker-fn';

type Asyncify = <A, B, C>((A, B) => C) => (A, B, Callback<C>) => void;


exports.optimizeModule =
  (wrapWorkerFn(asyncify(optimizeModule)): WorkerFnWithIO<OptimizationOptions>);
exports.transformModule =
  (wrapWorkerFn(transformModule): WorkerFnWithIO<TransformOptions>);
