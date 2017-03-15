/**
 * Copyright (c) 2017-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

jest.disableAutomock();

const ModuleGraph = require('../ModuleGraph');
const defaults = require('../../../defaults');

const FILE_TYPE = 'module';

describe('build setup', () => {
  const buildSetup = ModuleGraph.createBuildSetup(graph);
  const noOptions = {};
  const noEntryPoints = [];

  it('adds a prelude containing start time and `__DEV__` to the build', done => {
    buildSetup(noEntryPoints, noOptions, (error, result) => {
      expect(error).toEqual(null);

      const [prelude] = result.modules;
      expect(prelude).toEqual({
        dependencies: [],
        file: {
          code: 'var __DEV__=true,__BUNDLE_START_TIME__=Date.now();',
          path: '',
          type: 'script',
        },
      });
      done();
    });
  });

  it('sets `__DEV__` to false in the prelude if optimization is enabled', done => {
    buildSetup(noEntryPoints, {optimize: true}, (error, result) => {
      const [prelude] = result.modules;
      expect(prelude.file.code)
        .toEqual('var __DEV__=false,__BUNDLE_START_TIME__=Date.now();');
      done();
    });
  });

  it('places the module system implementation directly after the prelude', done => {
    buildSetup(noEntryPoints, noOptions, (error, result) => {
      const [, moduleSystem] = result.modules;
      expect(moduleSystem).toEqual({
        dependencies: [],
        file: {
          code: '',
          path: defaults.moduleSystem,
          type: FILE_TYPE,
        },
      });
      done();
    });
  });

  it('places polyfills after the module system', done => {
    buildSetup(noEntryPoints, noOptions, (error, result) => {
      const polyfills =
        Array.from(result.modules).slice(2, 2 + defaults.polyfills.length);
      expect(polyfills).toEqual(defaults.polyfills.map(moduleFromPath));
      done();
    });
  });

  it('places all entry points at the end', done => {
    const entryPoints = ['a', 'b', 'c'];
    buildSetup(entryPoints, noOptions, (error, result) => {
      expect(Array.from(result.modules).slice(-3))
        .toEqual(entryPoints.map(moduleFromPath));
      done();
    });
  });
});

function moduleFromPath(path) {
  return {
    dependencies: [],
    file: {
      code: '',
      path,
      type: FILE_TYPE,
    },
  };
}

function graph(entryPoints, platform, options, callback) {
  const modules = Array.from(entryPoints, moduleFromPath);
  callback(null, {
    entryModules: modules,
    modules,
  });
}
