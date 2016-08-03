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
  .dontMock('json-stable-stringify')
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
const fs = require('graceful-fs');

const packageJson =
  JSON.stringify({
    name: 'arbitrary',
    version: '1.0.0',
    description: "A require('foo') story",
  });

function mockFS(rootChildren) {
  fs.__setMockFilesystem({root: rootChildren});
}

function mockPackageFile() {
  mockFS({'package.json': packageJson});
}

function mockIndexFile(indexJs) {
  mockFS({'index.js': indexJs});
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
      options: {
        cacheTransformResults: true,
      },
      ...options,
      cache,
      fastfs,
      file: options && options.file || fileName,
      depGraphHelpers: new DependencyGraphHelpers(),
      moduleCache: new ModuleCache({fastfs, cache}),
    });

  const createJSONModule =
    (options) => createModule({...options, file: '/root/package.json'});

  beforeEach(function(done) {
    process.platform = 'linux';
    cache = createCache();
    fastfs = new Fastfs(
      'test',
      ['/root'],
      fileWatcher,
      {crawling: Promise.resolve([fileName, '/root/package.json']), ignore: []},
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

  describe('Extractors', () => {

    pit('uses custom require extractors if specified', () => {
      mockIndexFile('');
      const module = createModule({
        extractor: code => ({deps: {sync: ['foo', 'bar']}}),
      });

      return module.getDependencies().then(actual =>
        expect(actual).toEqual(['foo', 'bar']));
    });

    pit('uses a default extractor to extract dependencies', () => {
      mockIndexFile(`
        require('dependency-a');
        import * as b from "dependency-b";
        export {something} from 'dependency-c';
      `);

      const module = createModule();
      return module.getDependencies().then(dependencies =>
        expect(dependencies.sort())
          .toEqual(['dependency-a', 'dependency-b', 'dependency-c'])
      );
    });

    pit('does not extract dependencies from files annotated with @extern', () => {
      mockIndexFile(`
        /**
         * @extern
         */
        require('dependency-a');
        import * as b from "dependency-b";
        export {something} from 'dependency-c';
      `);

      const module = createModule();
      return module.getDependencies().then(dependencies =>
        expect(dependencies).toEqual([])
      );
    });

    pit('does not extract dependencies from JSON files', () => {
      mockPackageFile();
      const module = createJSONModule();
      return module.getDependencies().then(dependencies =>
        expect(dependencies).toEqual([])
      );
    });
  });

  describe('Custom Code Transform', () => {
    let transformCode;
    const fileContents = 'arbitrary(code);';
    const exampleCode = `
      ${'require'}('a');
      ${'System.import'}('b');
      ${'require'}('c');`;

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

    pit('passes the module and file contents to the transform if the file is annotated with @extern', () => {
      const module = createModule({transformCode});
      const fileContents = `
        /**
         * @extern
         */
      `;
      mockIndexFile(fileContents);
      return module.read().then(() => {
        expect(transformCode).toBeCalledWith(module, fileContents, {extern: true});
      });
    });

    pit('passes the module and file contents to the transform for JSON files', () => {
      mockPackageFile();
      const module = createJSONModule({transformCode});
      return module.read().then(() => {
        expect(transformCode).toBeCalledWith(module, packageJson, {extern: true});
      });
    });

    pit('does not extend the passed options object if the file is annotated with @extern', () => {
      const module = createModule({transformCode});
      const fileContents = `
        /**
         * @extern
         */
      `;
      mockIndexFile(fileContents);
      const options = {arbitrary: 'foo'};
      return module.read(options).then(() => {
        expect(options).not.toEqual(jasmine.objectContaining({extern: true}));
        expect(transformCode)
          .toBeCalledWith(module, fileContents, {...options, extern: true});
      });
    });

    pit('does not extend the passed options object for JSON files', () => {
      mockPackageFile();
      const module = createJSONModule({transformCode});
      const options = {arbitrary: 'foo'};
      return module.read(options).then(() => {
        expect(options).not.toEqual(jasmine.objectContaining({extern: true}));
        expect(transformCode)
          .toBeCalledWith(module, packageJson, {...options, extern: true});
      });
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

    pit('forwards all additional properties of the result provided by `transformCode`', () => {
      const mockedResult = {
        code: exampleCode,
        arbitrary: 'arbitrary',
        dependencyOffsets: [12, 764],
        map: {version: 3},
        subObject: {foo: 'bar'},
      };
      transformCode.mockReturnValue(Promise.resolve(mockedResult));
      const module = createModule({transformCode});

      return module.read().then((result) => {
        expect(result).toEqual(jasmine.objectContaining(mockedResult));
      });
    });

    pit('does not store anything but dependencies if the `cacheTransformResults` option is disabled', () => {
      const mockedResult = {
        code: exampleCode,
        arbitrary: 'arbitrary',
        dependencies: ['foo', 'bar'],
        dependencyOffsets: [12, 764],
        map: {version: 3},
        subObject: {foo: 'bar'},
      };
      transformCode.mockReturnValue(Promise.resolve(mockedResult));
      const module = createModule({transformCode, options: {
        cacheTransformResults: false,
      }});

      return module.read().then((result) => {
        expect(result).toEqual({
          dependencies: ['foo', 'bar'],
        });
      });
    });

    pit('stores all things if options is undefined', () => {
      const mockedResult = {
        code: exampleCode,
        arbitrary: 'arbitrary',
        dependencies: ['foo', 'bar'],
        dependencyOffsets: [12, 764],
        map: {version: 3},
        subObject: {foo: 'bar'},
      };
      transformCode.mockReturnValue(Promise.resolve(mockedResult));
      const module = createModule({transformCode, options: undefined});

      return module.read().then((result) => {
        expect(result).toEqual({ ...mockedResult, source: 'arbitrary(code);'});
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

    pit('exposes the raw file contents as `source` property', () => {
      const module = createModule({transformCode});
      return module.read()
        .then(data => expect(data.source).toBe(fileContents));
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
      };

      it('gets dependencies from the cache with the same cache key for the same transform options', () => {
        const options = {some: 'options'};
        module.getDependencies(options); // first call
        module.getDependencies(options); // second call

        const {calls} = cache.get.mock;
        callsEqual(calls[0], calls[1]);
      });

      it('gets dependencies from the cache with the same cache key for the equivalent transform options', () => {
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
