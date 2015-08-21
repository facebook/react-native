/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

jest
  .dontMock('absolute-path')
  .dontMock('../fastfs')
  .dontMock('../replacePatterns')
  .dontMock('../DependencyGraph/docblock')
  .dontMock('../../FileWatcher')
  .dontMock('../Module');

jest
  .mock('fs');

describe('Module', () => {
  var Fastfs;
  var Module;
  var ModuleCache;
  var Promise;
  var fs;

  const FileWatcher = require('../../FileWatcher');
  const fileWatcher = new FileWatcher(['/root']);

  beforeEach(function() {
    Fastfs = require('../fastfs');
    Module = require('../Module');
    ModuleCache = require('../ModuleCache');
    Promise = require('promise');
    fs = require('fs');
  });

  describe('Async Dependencies', () => {
    function expectAsyncDependenciesToEqual(expected) {
      var fastfs = new Fastfs(
        ['/root'],
        fileWatcher,
        {crawling: Promise.resolve(['/root/index.js']), ignore: []},
      );

      return fastfs.build().then(() => {
        var module = new Module('/root/index.js', fastfs, new ModuleCache(fastfs));

        return module.getAsyncDependencies().then(actual =>
          expect(actual).toEqual(expected)
        );
      });
    }

    pit('should recognize single dependency', () => {
      fs.__setMockFilesystem({
        'root': {
          'index.js': 'require.ensure(["dep1"], function() {});',
        }
      });

      return expectAsyncDependenciesToEqual([['dep1']]);
    });

    pit('should parse single quoted dependencies', () => {
      fs.__setMockFilesystem({
        'root': {
          'index.js': 'require.ensure([\'dep1\'], function() {});',
        }
      });

      return expectAsyncDependenciesToEqual([['dep1']]);
    });

    pit('should recognize multiple dependencies on the same statement', () => {
      fs.__setMockFilesystem({
        'root': {
          'index.js': 'require.ensure(["dep1", "dep2"], function() {});',
        }
      });

      return expectAsyncDependenciesToEqual([['dep1', 'dep2']]);
    });

    pit('should group async dependencies', () => {
      fs.__setMockFilesystem({
        'root': {
          'index.js': [
            'require.ensure(["dep1", "dep2"], function() {});',
            'require.ensure(["dep3", "dep4"], function() {});',
          ].join('\n'),
        }
      });

      return expectAsyncDependenciesToEqual([
        ['dep1', 'dep2'],
        ['dep3', 'dep4']
      ]);
    });

    pit('shouldn\'t throw with ES6 arrow functions', () => {
      fs.__setMockFilesystem({
        'root': {
          'index.js': 'require.ensure(["dep1", "dep2"], () => {});',
        }
      });

      return expectAsyncDependenciesToEqual([['dep1', 'dep2']]);
    });

    pit('parse fine new lines', () => {
      fs.__setMockFilesystem({
        'root': {
          'index.js': 'require.ensure(["dep1", \n"dep2"], () => {});',
        }
      });

      return expectAsyncDependenciesToEqual([['dep1', 'dep2']]);
    });

    pit('ignore comments', () => {
      fs.__setMockFilesystem({
        'root': {
          'index.js': 'require.ensure(["dep1", /*comment*/"dep2"], () => {});',
        }
      });

      return expectAsyncDependenciesToEqual([['dep1', 'dep2']]);
    });
  });
});
