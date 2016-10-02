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

const memoize = require('async/memoize');
const queue = require('async/queue');
const seq = require('async/seq');
const invariant = require('fbjs/lib/invariant');

import type {GraphFn, LoadFn, ResolveFn, File, Module} from './types.flow';

const createParentModule =
  () => ({file: {path: '', ast: {}}, dependencies: []});

const noop = () => {};

exports.create = function create(resolve: ResolveFn, load: LoadFn): GraphFn {
  function Graph(entryPoints, platform, options = {}, callback = noop) {
    const {cwd = '', log = (console: any), optimize = false, skip} = options;

    if (typeof platform !== 'string') {
      log.error('`Graph`, called without a platform');
      return callback(Error('The target platform has to be passed'));
    }

    const modules: Map<string | null, Module> = new Map();
    modules.set(null, createParentModule());

    const loadQueue = queue(seq(
      ({id, parent}, cb) => resolve(id, parent, platform, options, cb),
      memoize((file, cb) => load(file, {log, optimize}, cb)),
    ), Number.MAX_SAFE_INTEGER);

    const cleanup = () => (loadQueue.drain = noop);
    loadQueue.drain = () => {
      cleanup();
      callback(null, collect(null, modules));
    };

    function loadModule(id: string, parent: string | null, parentDependencyIndex) {
      function onFileLoaded(
        error: ?Error,
        file: File,
        dependencyIDs: Array<string>,
      ) {
        if (error) {
          cleanup();
          callback(error);
          return;
        }

        const parentModule = modules.get(parent);
        invariant(parentModule, 'Invalid parent module: ' + String(parent));
        parentModule.dependencies[parentDependencyIndex] = {id, path: file.path};

        if ((!skip || !skip.has(file.path)) && !modules.has(file.path)) {
          const dependencies = Array(dependencyIDs.length);
          modules.set(file.path, {file, dependencies});
          dependencyIDs.forEach(
            (dependencyID, j) => loadModule(dependencyID, file.path, j));
        }
      }
      loadQueue.push({id, parent: parent != null ? parent : cwd}, onFileLoaded);
    }

    let i = 0;
    for (const entryPoint of entryPoints) {
      loadModule(entryPoint, null, i++);
    }

    if (loadQueue.idle()) {
      log.error('`Graph` called without any entry points');
      cleanup();
      callback(Error('At least one entry point has to be passed.'));
    }
  }

  return Graph;
};

function collect(
  path,
  modules,
  serialized = [],
  seen: Set<string | null> = new Set(),
): Array<Module> {
  const module = modules.get(path);
  if (!module || seen.has(path)) { return serialized; }

  if (path !== null) {
    serialized.push(module);
    seen.add(path);
  }
  module.dependencies.forEach(
    dependency => collect(dependency.path, modules, serialized, seen));

  return serialized;
}
