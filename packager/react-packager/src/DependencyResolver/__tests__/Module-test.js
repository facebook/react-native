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
  .dontMock('../lib/extractRequires')
  .dontMock('../lib/replacePatterns')
  .dontMock('../DependencyGraph/docblock')
  .dontMock('../Module');

jest
  .mock('fs');

const Fastfs = require('../fastfs');
const Module = require('../Module');
const ModuleCache = require('../ModuleCache');
const Promise = require('promise');
const fs = require('fs');

describe('Module', () => {
  const fileWatcher = {
    on: () =>  this,
    isWatchman: () => Promise.resolve(false),
  };

  const Cache = jest.genMockFn();
  Cache.prototype.get = jest.genMockFn().mockImplementation(
    (filepath, field, cb) => cb(filepath)
  );
  Cache.prototype.invalidate = jest.genMockFn();
  Cache.prototype.end = jest.genMockFn();


  describe('Async Dependencies', () => {
    function expectAsyncDependenciesToEqual(expected) {
      const fastfs = new Fastfs(
        'test',
        ['/root'],
        fileWatcher,
        {crawling: Promise.resolve(['/root/index.js']), ignore: []},
      );
      const cache = new Cache();

      return fastfs.build().then(() => {
        const module = new Module(
          '/root/index.js',
          fastfs,
          new ModuleCache(fastfs, cache),
          cache
        );

        return module.getAsyncDependencies().then(actual =>
          expect(actual).toEqual(expected)
        );
      });
    }

    pit('should recognize single dependency', () => {
      fs.__setMockFilesystem({
        'root': {
          'index.js': 'System.import("dep1")',
        },
      });

      return expectAsyncDependenciesToEqual([['dep1']]);
    });

    pit('should parse single quoted dependencies', () => {
      fs.__setMockFilesystem({
        'root': {
          'index.js': 'System.import(\'dep1\')',
        },
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
        },
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
        },
      });

      return expectAsyncDependenciesToEqual([['dep1']]);
    });
  });

  describe('Extrators', () => {

    function createModuleWithExtractor(extractor) {
      const fastfs = new Fastfs(
        'test',
        ['/root'],
        fileWatcher,
        {crawling: Promise.resolve(['/root/index.js']), ignore: []},
      );
      const cache = new Cache();

      return fastfs.build().then(() => {
        return new Module(
          '/root/index.js',
          fastfs,
          new ModuleCache(fastfs, cache),
          cache,
          extractor
        );
      });
    }

    pit('uses custom require extractors if specified', () => {
      fs.__setMockFilesystem({
        'root': {
          'index.js': '',
        },
      });

      return createModuleWithExtractor(
        code => ({deps: {sync: ['foo', 'bar']}})
      ).then(module =>
        module.getDependencies().then(actual =>
          expect(actual).toEqual(['foo', 'bar'])
        )
      );
    });
  });
});
