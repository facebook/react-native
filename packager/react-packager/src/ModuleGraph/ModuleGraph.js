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

const defaults = require('../../../defaults');
const nullthrows = require('fbjs/lib/nullthrows');
const parallel = require('async/parallel');
const seq = require('async/seq');

const {virtualModule} = require('./output/util');

import type {
  Callback,
  GraphFn,
  GraphResult,
  Module,
} from './types.flow';

type BuildFn = (
  entryPoints: Iterable<string>,
  options: BuildOptions,
  callback: Callback<{modules: Iterable<Module>, entryModules: Iterable<Module>}>,
) => void;

type BuildOptions = {|
  optimize?: boolean,
  platform?: string,
|};

exports.createBuildSetup = (
  graph: GraphFn,
  translateDefaultsPath: string => string = x => x,
): BuildFn =>
  (entryPoints, options, callback) => {
    const {
      optimize = false,
      platform = defaults.platforms[0],
    } = options;
    const graphOptions = {optimize};

    const graphWithOptions =
      (entry, cb) => graph(entry, platform, graphOptions, cb);
    const graphOnlyModules = seq(graphWithOptions, getModules);

    parallel({
      graph: cb => graphWithOptions(
        concat(defaults.runBeforeMainModule, entryPoints),
        cb,
      ),
      moduleSystem: cb => graphOnlyModules(
        [translateDefaultsPath(defaults.moduleSystem)],
        cb,
      ),
      polyfills: cb => graphOnlyModules(
        defaults.polyfills.map(translateDefaultsPath),
        cb,
      ),
    }, (
      error: ?Error,
      result?: {graph: GraphResult, moduleSystem: Array<Module>, polyfills: Array<Module>},
    ) => {
      if (error) {
        callback(error);
        return;
      }


      const {
        graph: {modules, entryModules},
        moduleSystem,
        polyfills,
      } = nullthrows(result);

      callback(null, {
        entryModules,
        modules: concat([prelude(optimize)], moduleSystem, polyfills, modules),
      });
    });
  };

const getModules = (x, cb) => cb(null, x.modules);

function* concat<T>(...iterables: Array<Iterable<T>>): Iterable<T> {
  for (const it of iterables) {
    yield* it;
  }
}

function prelude(optimize) {
  return virtualModule(
    `var __DEV__= ${String(!optimize)
    }, __BUNDLE_START_TIME__ = Date.now();`
  );
}
