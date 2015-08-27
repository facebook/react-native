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
        'test',
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
          'index.js': 'System.import("dep1")',
        }
      });

      return expectAsyncDependenciesToEqual([['dep1']]);
    });

    pit('should parse single quoted dependencies', () => {
      fs.__setMockFilesystem({
        'root': {
          'index.js': 'System.import(\'dep1\')',
        }
      });

      return expectAsyncDependenciesToEqual([['dep1']]);
    });

    pit('should parse multiple async dependencies on the same module', () => {
      fs.__setMockFilesystem({
        'root': {
          'index.js': [
            'System.import("dep1")',
            'System.import("dep2")',
          ].join('\n'),
        }
      });

      return expectAsyncDependenciesToEqual([
        ['dep1'],
        ['dep2'],
      ]);
    });

    pit('parse fine new lines', () => {
      fs.__setMockFilesystem({
        'root': {
          'index.js': 'System.import(\n"dep1"\n)',
        }
      });

      return expectAsyncDependenciesToEqual([['dep1']]);
    });
  });
});
