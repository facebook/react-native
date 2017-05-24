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

const invariant = require('fbjs/lib/invariant');
const memoize = require('async/memoize');
const nullthrows = require('fbjs/lib/nullthrows');
const queue = require('async/queue');
const seq = require('async/seq');

import type {
  Callback,
  File,
  GraphFn,
  LoadFn,
  ResolveFn,
} from './types.flow';

type Async$Queue<T, C> = {
  buffer: number,
  concurrency: number,
  drain: () => mixed,
  empty: () => mixed,
  error: (Error, T) => mixed,
  idle(): boolean,
  kill(): void,
  length(): number,
  pause(): void,
  paused: boolean,
  push(T | Array<T>, void | C): void,
  resume(): void,
  running(): number,
  saturated: () => mixed,
  started: boolean,
  unsaturated: () => mixed,
  unshift(T, void | C): void,
  workersList(): Array<T>,
};

type LoadQueue =
  Async$Queue<{id: string, parent: ?string}, Callback<File, Array<string>>>;

const createParentModule =
  () => ({file: {code: '', type: 'script', path: ''}, dependencies: []});

const noop = () => {};
const NO_OPTIONS = {};

exports.create = function create(resolve: ResolveFn, load: LoadFn): GraphFn {
  function Graph(entryPoints, platform, options, callback = noop) {
    const {
      log = (console: any),
      optimize = false,
      skip,
    } = options || NO_OPTIONS;

    if (typeof platform !== 'string') {
      log.error('`Graph`, called without a platform');
      callback(Error('The target platform has to be passed'));
      return;
    }

    const loadQueue: LoadQueue = queue(seq(
      ({id, parent}, cb) => resolve(id, parent, platform, options || NO_OPTIONS, cb),
      memoize((file, cb) => load(file, {log, optimize}, cb)),
    ), Number.MAX_SAFE_INTEGER);

    const {collect, loadModule} = createGraphHelpers(loadQueue, skip);

    loadQueue.drain = () => {
      loadQueue.kill();
      callback(null, collect());
    };
    loadQueue.error = error => {
      loadQueue.error = noop;
      loadQueue.kill();
      callback(error);
    };

    let i = 0;
    for (const entryPoint of entryPoints) {
      loadModule(entryPoint, null, i++);
    }

    if (i === 0) {
      log.error('`Graph` called without any entry points');
      loadQueue.kill();
      callback(Error('At least one entry point has to be passed.'));
    }
  }

  return Graph;
};

function createGraphHelpers(loadQueue, skip) {
  const modules = new Map([[null, createParentModule()]]);

  function collect(
    path = null,
    serialized = {entryModules: [], modules: []},
    seen = new Set(),
  ) {
    const module = modules.get(path);
    if (module == null || seen.has(path)) {
      return serialized;
    }

    const {dependencies} = module;
    if (path === null) {
      serialized.entryModules =
        dependencies.map(dep => nullthrows(modules.get(dep.path)));
    } else {
      serialized.modules.push(module);
      seen.add(path);
    }

    for (const dependency of dependencies) {
      collect(dependency.path, serialized, seen);
    }

    return serialized;
  }

  function loadModule(id, parent, parentDepIndex) {
    loadQueue.push(
      {id, parent},
      (error, file, dependencyIDs) =>
        onFileLoaded(error, file, dependencyIDs, id, parent, parentDepIndex),
    );
  }

  function onFileLoaded(
    error,
    file,
    dependencyIDs,
    id,
    parent,
    parentDependencyIndex,
  ) {
    if (error) {
      return;
    }

    const {path} = nullthrows(file);
    dependencyIDs = nullthrows(dependencyIDs);

    const parentModule = modules.get(parent);
    invariant(parentModule, 'Invalid parent module: ' + String(parent));
    parentModule.dependencies[parentDependencyIndex] = {id, path};

    if ((!skip || !skip.has(path)) && !modules.has(path)) {
      const module = {
        dependencies: Array(dependencyIDs.length),
        file: nullthrows(file),
      };
      modules.set(path, module);
      for (let i = 0; i < dependencyIDs.length; ++i) {
        loadModule(dependencyIDs[i], path, i);
      }
    }
  }

  return {collect, loadModule};
}
