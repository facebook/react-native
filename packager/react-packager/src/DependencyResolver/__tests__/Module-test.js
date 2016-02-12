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
const DependencyGraphHelpers = require('../DependencyGraph/DependencyGraphHelpers');
const Promise = require('promise');
const fs = require('graceful-fs');

function mockIndexFile(indexJs) {
  fs.__setMockFilesystem({'root': {'index.js': indexJs}});
}

describe('Module', () => {
  const fileWatcher = {
    on: () =>  this,
    isWatchman: () => Promise.resolve(false),
  };
  const fileName = '/root/index.js';

  let cache, fastfs;

  const createCache = () => ({
    get: jest.genMockFn().mockImplementation(
      (filepath, field, cb) => cb(filepath)
    ),
    invalidate: jest.genMockFn(),
    end: jest.genMockFn(),
  });

  const createModule = (options) =>
    new Module({
      cache,
      fastfs,
      file: fileName,
      depGraphHelpers: new DependencyGraphHelpers(),
      moduleCache: new ModuleCache({fastfs, cache}),
      ...options,
    });

  beforeEach(function(done) {
    cache = createCache();
    fastfs = new Fastfs(
      'test',
      ['/root'],
      fileWatcher,
      {crawling: Promise.resolve([fileName]), ignore: []},
    );

    fastfs.build().then(done);
  });

  describe('Module ID', () => {
    const moduleId = 'arbitraryModule';
    const source =
    `/**
       * @providesModule ${moduleId}
       */
    `;

    let module;
    beforeEach(() => {
      module = createModule();
    });

    describe('@providesModule annotations', () => {
      beforeEach(() => {
        mockIndexFile(source);
      });

      pit('extracts the module name from the header', () =>
        module.getName().then(name => expect(name).toEqual(moduleId))
      );

      pit('identifies the module as haste module', () =>
        module.isHaste().then(isHaste => expect(isHaste).toBe(true))
      );

      pit('does not transform the file in order to access the name', () => {
        const transformCode =
          jest.genMockFn().mockReturnValue(Promise.resolve());
        return createModule({transformCode}).getName()
          .then(() => expect(transformCode).not.toBeCalled());
      });

      pit('does not transform the file in order to access the haste status', () => {
        const transformCode =
          jest.genMockFn().mockReturnValue(Promise.resolve());
        return createModule({transformCode}).isHaste()
          .then(() => expect(transformCode).not.toBeCalled());
      });
    });

    describe('@provides annotations', () => {
      beforeEach(() => {
        mockIndexFile(source.replace(/@providesModule/, '@provides'));
      });

      pit('extracts the module name from the header if it has a @provides annotation', () =>
        module.getName().then(name => expect(name).toEqual(moduleId))
      );

      pit('identifies the module as haste module', () =>
        module.isHaste().then(isHaste => expect(isHaste).toBe(true))
      );

      pit('does not transform the file in order to access the name', () => {
        const transformCode =
          jest.genMockFn().mockReturnValue(Promise.resolve());
        return createModule({transformCode}).getName()
          .then(() => expect(transformCode).not.toBeCalled());
      });

      pit('does not transform the file in order to access the haste status', () => {
        const transformCode =
          jest.genMockFn().mockReturnValue(Promise.resolve());
        return createModule({transformCode}).isHaste()
          .then(() => expect(transformCode).not.toBeCalled());
      });
    });

    describe('no annotation', () => {
      beforeEach(() => {
        mockIndexFile('arbitrary(code);');
      });

      pit('uses the file name as module name', () =>
        module.getName().then(name => expect(name).toEqual(fileName))
      );

      pit('does not identify the module as haste module', () =>
        module.isHaste().then(isHaste => expect(isHaste).toBe(false))
      );

      pit('does not transform the file in order to access the name', () => {
        const transformCode =
          jest.genMockFn().mockReturnValue(Promise.resolve());
        return createModule({transformCode}).getName()
          .then(() => expect(transformCode).not.toBeCalled());
      });

      pit('does not transform the file in order to access the haste status', () => {
        const transformCode =
          jest.genMockFn().mockReturnValue(Promise.resolve());
        return createModule({transformCode}).isHaste()
          .then(() => expect(transformCode).not.toBeCalled());
      });
    });
  });

  describe('Code', () => {
    const fileContents = 'arbitrary(code)';
    beforeEach(function() {
      mockIndexFile(fileContents);
    });

    pit('exposes file contents as `code` property on the data exposed by `read()`', () =>
      createModule().read().then(({code}) =>
        expect(code).toBe(fileContents))
    );

    pit('exposes file contents via the `getCode()` method', () =>
      createModule().getCode().then(code =>
        expect(code).toBe(fileContents))
    );
  });

  describe('Extrators', () => {

    pit('uses custom require extractors if specified', () => {
      mockIndexFile('');
      const module = createModule({
        extractor: code => ({deps: {sync: ['foo', 'bar']}}),
      });

      return module.getDependencies().then(actual =>
        expect(actual).toEqual(['foo', 'bar']));
    });
  });

  describe('Custom Code Transform', () => {
    let transformCode;
    const fileContents = 'arbitrary(code);';
    const exampleCode = `
      require('a');
      arbitrary.code('b');
      require('c');`;

    beforeEach(function() {
      transformCode = jest.genMockFn();
      mockIndexFile(fileContents);
      transformCode.mockReturnValue(Promise.resolve({code: ''}));
    });

    pit('passes the module and file contents to the transform function when reading', () => {
      const module = createModule({transformCode});
      return module.read()
        .then(() => {
          expect(transformCode).toBeCalledWith(module, fileContents, undefined);
        });
    });

    pit('passes any additional options to the transform function when reading', () => {
      const module = createModule({transformCode});
      const transformOptions = {arbitrary: Object()};
      return module.read(transformOptions)
        .then(() =>
          expect(transformCode.mock.calls[0][2]).toBe(transformOptions)
        );
    });

    pit('uses the code that `transformCode` resolves to to extract dependencies', () => {
      transformCode.mockReturnValue(Promise.resolve({code: exampleCode}));
      const module = createModule({transformCode});

      return module.getDependencies().then(dependencies => {
        expect(dependencies).toEqual(['a', 'c']);
      });
    });

    pit('uses dependencies that `transformCode` resolves to, instead of extracting them', () => {
      const mockedDependencies = ['foo', 'bar'];
      transformCode.mockReturnValue(Promise.resolve({
        code: exampleCode,
        dependencies: mockedDependencies,
      }));
      const module = createModule({transformCode});

      return module.getDependencies().then(dependencies => {
        expect(dependencies).toEqual(mockedDependencies);
      });
    });

    pit('exposes the transformed code rather than the raw file contents', () => {
      transformCode.mockReturnValue(Promise.resolve({code: exampleCode}));
      const module = createModule({transformCode});
      return Promise.all([module.read(), module.getCode()])
        .then(([data, code]) => {
          expect(data.code).toBe(exampleCode);
          expect(code).toBe(exampleCode);
        });
    });

    pit('exposes a source map returned by the transform', () => {
      const map = {version: 3};
      transformCode.mockReturnValue(Promise.resolve({map, code: exampleCode}));
      const module = createModule({transformCode});
      return Promise.all([module.read(), module.getMap()])
        .then(([data, sourceMap]) => {
          expect(data.map).toBe(map);
          expect(sourceMap).toBe(map);
        });
    });

    describe('Caching based on options', () => {
      let module;
      beforeEach(function() {
        module = createModule({transformCode});
      });

      const callsEqual = ([path1, key1], [path2, key2]) => {
        expect(path1).toEqual(path2);
        expect(key1).toEqual(key2);
      }

      it('gets dependencies from the cache with the same cache key for the same transform options', () => {
        const options = {some: 'options'};
        module.getDependencies(options); // first call
        module.getDependencies(options); // second call

        const {calls} = cache.get.mock;
        callsEqual(calls[0], calls[1]);
      });

      it('gets dependencies from the cache with the same cache key for the equivalent transform options', () => {
        const options = {some: 'options'};
        module.getDependencies({a: 'b', c: 'd'}); // first call
        module.getDependencies({c: 'd', a: 'b'}); // second call

        const {calls} = cache.get.mock;
        callsEqual(calls[0], calls[1]);
      });

      it('gets dependencies from the cache with different cache keys for different transform options', () => {
        module.getDependencies({some: 'options'});
        module.getDependencies({other: 'arbitrary options'});
        const {calls} = cache.get.mock;
        expect(calls[0][1]).not.toEqual(calls[1][1]);
      });

      it('gets code from the cache with the same cache key for the same transform options', () => {
        const options = {some: 'options'};
        module.getCode(options); // first call
        module.getCode(options); // second call

        const {calls} = cache.get.mock;
        callsEqual(calls[0], calls[1]);
      });

      it('gets code from the cache with the same cache key for the equivalent transform options', () => {
        const options = {some: 'options'};
        module.getCode({a: 'b', c: 'd'}); // first call
        module.getCode({c: 'd', a: 'b'}); // second call

        const {calls} = cache.get.mock;
        callsEqual(calls[0], calls[1]);
      });

      it('gets code from the cache with different cache keys for different transform options', () => {
        module.getCode({some: 'options'});
        module.getCode({other: 'arbitrary options'});
        const {calls} = cache.get.mock;
        expect(calls[0][1]).not.toEqual(calls[1][1]);
      });
    });
  });
});
