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
  .dontMock('imurmurhash')
  .dontMock('../fastfs')
  .dontMock('../lib/replacePatterns')
  .dontMock('../DependencyGraph/docblock')
  .dontMock('../Module');

jest
  .mock('fs');

const Fastfs = require('../fastfs');
const Module = require('../Module');
const ModuleCache = require('../ModuleCache');
const DependencyGraphHelpers = require('../DependencyGraph/DependencyGraphHelpers');
const TransformCache = require('../../lib/TransformCache');
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
  const fileName = '/root/index.js';

  let cache, fastfs;

  const createCache = () => ({
    get: jest.genMockFn().mockImplementation(
      (filepath, field, cb) => cb(filepath)
    ),
    invalidate: jest.genMockFn(),
    end: jest.genMockFn(),
  });

  let transformCacheKey;
  const createModule = (options) =>
    new Module({
      options: {
        cacheTransformResults: true,
      },
      transformCode: (module, sourceCode, transformOptions) => {
        return Promise.resolve({code: sourceCode});
      },
      ...options,
      cache,
      fastfs,
      file: options && options.file || fileName,
      depGraphHelpers: new DependencyGraphHelpers(),
      moduleCache: new ModuleCache({fastfs, cache}),
      transformCacheKey,
    });

  const createFastFS = () =>
    new Fastfs(
      'test',
      ['/root'],
      ['/root/index.js', '/root/package.json'],
      {ignore: []},
    );

  const createJSONModule =
    (options) => createModule({...options, file: '/root/package.json'});

  beforeEach(function() {
    process.platform = 'linux';
    cache = createCache();
    fastfs = createFastFS();
    transformCacheKey = 'abcdef';
    TransformCache.mock.reset();
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

      it('extracts the module name from the header', () =>
        module.getName().then(name => expect(name).toEqual(moduleId))
      );

      it('identifies the module as haste module', () =>
        module.isHaste().then(isHaste => expect(isHaste).toBe(true))
      );

      it('does not transform the file in order to access the name', () => {
        const transformCode =
          jest.genMockFn().mockReturnValue(Promise.resolve());
        return createModule({transformCode}).getName()
          .then(() => expect(transformCode).not.toBeCalled());
      });

      it('does not transform the file in order to access the haste status', () => {
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

      it('extracts the module name from the header if it has a @provides annotation', () =>
        module.getName().then(name => expect(name).toEqual(moduleId))
      );

      it('identifies the module as haste module', () =>
        module.isHaste().then(isHaste => expect(isHaste).toBe(true))
      );

      it('does not transform the file in order to access the name', () => {
        const transformCode =
          jest.genMockFn().mockReturnValue(Promise.resolve());
        return createModule({transformCode}).getName()
          .then(() => expect(transformCode).not.toBeCalled());
      });

      it('does not transform the file in order to access the haste status', () => {
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

      it('uses the file name as module name', () =>
        module.getName().then(name => expect(name).toEqual(fileName))
      );

      it('does not identify the module as haste module', () =>
        module.isHaste().then(isHaste => expect(isHaste).toBe(false))
      );

      it('does not transform the file in order to access the name', () => {
        const transformCode =
          jest.genMockFn().mockReturnValue(Promise.resolve());
        return createModule({transformCode}).getName()
          .then(() => expect(transformCode).not.toBeCalled());
      });

      it('does not transform the file in order to access the haste status', () => {
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

    it('exposes file contents as `code` property on the data exposed by `read()`', () =>
      createModule().read().then(({code}) =>
        expect(code).toBe(fileContents))
    );

    it('exposes file contents via the `getCode()` method', () =>
      createModule().getCode().then(code =>
        expect(code).toBe(fileContents))
    );
  });

  describe('Custom Code Transform', () => {
    let transformCode;
    let transformResult;
    const fileContents = 'arbitrary(code);';
    const exampleCode = `
      ${'require'}('a');
      ${'System.import'}('b');
      ${'require'}('c');`;

    beforeEach(function() {
      transformResult = {code: ''};
      transformCode = jest.genMockFn()
        .mockImplementation((module, sourceCode, options) => {
          TransformCache.writeSync({
            filePath: module.path,
            sourceCode,
            transformOptions: options,
            transformCacheKey,
            result: transformResult,
          });
          return Promise.resolve(transformResult);
        });
      mockIndexFile(fileContents);
    });

    it('passes the module and file contents to the transform function when reading', () => {
      const module = createModule({transformCode});
      return module.read()
        .then(() => {
          expect(transformCode).toBeCalledWith(module, fileContents, undefined);
        });
    });

    it('passes any additional options to the transform function when reading', () => {
      const module = createModule({transformCode});
      const transformOptions = {arbitrary: Object()};
      return module.read(transformOptions)
        .then(() =>
          expect(transformCode.mock.calls[0][2]).toBe(transformOptions)
        );
    });

    it('passes module and file contents if the file is annotated with @extern', () => {
      const module = createModule({transformCode});
      const customFileContents = `
        /**
         * @extern
         */
      `;
      mockIndexFile(customFileContents);
      return module.read().then(() => {
        expect(transformCode).toBeCalledWith(module, customFileContents, {extern: true});
      });
    });

    it('passes the module and file contents to the transform for JSON files', () => {
      mockPackageFile();
      const module = createJSONModule({transformCode});
      return module.read().then(() => {
        expect(transformCode).toBeCalledWith(module, packageJson, {extern: true});
      });
    });

    it('does not extend the passed options object if the file is annotated with @extern', () => {
      const module = createModule({transformCode});
      const customFileContents = `
        /**
         * @extern
         */
      `;
      mockIndexFile(customFileContents);
      const options = {arbitrary: 'foo'};
      return module.read(options).then(() => {
        expect(options).not.toEqual(jasmine.objectContaining({extern: true}));
        expect(transformCode)
          .toBeCalledWith(module, customFileContents, {...options, extern: true});
      });
    });

    it('does not extend the passed options object for JSON files', () => {
      mockPackageFile();
      const module = createJSONModule({transformCode});
      const options = {arbitrary: 'foo'};
      return module.read(options).then(() => {
        expect(options).not.toEqual(jasmine.objectContaining({extern: true}));
        expect(transformCode)
          .toBeCalledWith(module, packageJson, {...options, extern: true});
      });
    });

    it('uses dependencies that `transformCode` resolves to, instead of extracting them', () => {
      const mockedDependencies = ['foo', 'bar'];
      transformResult = {
        code: exampleCode,
        dependencies: mockedDependencies,
      };
      const module = createModule({transformCode});

      return module.getDependencies().then(dependencies => {
        expect(dependencies).toEqual(mockedDependencies);
      });
    });

    it('forwards all additional properties of the result provided by `transformCode`', () => {
      transformResult = {
        code: exampleCode,
        arbitrary: 'arbitrary',
        dependencyOffsets: [12, 764],
        map: {version: 3},
        subObject: {foo: 'bar'},
      };
      const module = createModule({transformCode});

      return module.read().then((result) => {
        expect(result).toEqual(jasmine.objectContaining(transformResult));
      });
    });

    it('only stores dependencies if `cacheTransformResults` option is disabled', () => {
      transformResult = {
        code: exampleCode,
        arbitrary: 'arbitrary',
        dependencies: ['foo', 'bar'],
        dependencyOffsets: [12, 764],
        map: {version: 3},
        subObject: {foo: 'bar'},
      };
      const module = createModule({transformCode, options: {
        cacheTransformResults: false,
      }});

      return module.read().then((result) => {
        expect(result).toEqual({
          dependencies: ['foo', 'bar'],
        });
      });
    });

    it('stores all things if options is undefined', () => {
      transformResult = {
        code: exampleCode,
        arbitrary: 'arbitrary',
        dependencies: ['foo', 'bar'],
        dependencyOffsets: [12, 764],
        map: {version: 3},
        subObject: {foo: 'bar'},
      };
      const module = createModule({transformCode, options: undefined});

      return module.read().then((result) => {
        expect(result).toEqual({ ...transformResult, source: 'arbitrary(code);'});
      });
    });

    it('exposes the transformed code rather than the raw file contents', () => {
      transformResult = {code: exampleCode};
      const module = createModule({transformCode});
      return Promise.all([module.read(), module.getCode()])
        .then(([data, code]) => {
          expect(data.code).toBe(exampleCode);
          expect(code).toBe(exampleCode);
        });
    });

    it('exposes the raw file contents as `source` property', () => {
      const module = createModule({transformCode});
      return module.read()
        .then(data => expect(data.source).toBe(fileContents));
    });

    it('exposes a source map returned by the transform', () => {
      const map = {version: 3};
      transformResult = {map, code: exampleCode};
      const module = createModule({transformCode});
      return Promise.all([module.read(), module.getMap()])
        .then(([data, sourceMap]) => {
          expect(data.map).toBe(map);
          expect(sourceMap).toBe(map);
        });
    });

    it('caches the transform result for the same transform options', () => {
      let module = createModule({transformCode});
      return module.read()
        .then(() => {
          expect(transformCode).toHaveBeenCalledTimes(1);
          // We want to check transform caching rather than shallow caching of
          // Promises returned by read().
          module = createModule({transformCode});
          return module.read()
            .then(() => {
              expect(transformCode).toHaveBeenCalledTimes(1);
            });
        });
    });

    it('triggers a new transform for different transform options', () => {
      const module = createModule({transformCode});
      return module.read({foo: 1})
        .then(() => {
          expect(transformCode).toHaveBeenCalledTimes(1);
          return module.read({foo: 2})
            .then(() => {
              expect(transformCode).toHaveBeenCalledTimes(2);
            });
        });
    });

    it('triggers a new transform for different source code', () => {
      let module = createModule({transformCode});
      return module.read()
        .then(() => {
          expect(transformCode).toHaveBeenCalledTimes(1);
          cache = createCache();
          fastfs = createFastFS();
          mockIndexFile('test');
          module = createModule({transformCode});
          return module.read()
            .then(() => {
              expect(transformCode).toHaveBeenCalledTimes(2);
            });
        });
    });

    it('triggers a new transform for different transform cache key', () => {
      let module = createModule({transformCode});
      return module.read()
        .then(() => {
          expect(transformCode).toHaveBeenCalledTimes(1);
          transformCacheKey = 'other';
          module = createModule({transformCode});
          return module.read()
            .then(() => {
              expect(transformCode).toHaveBeenCalledTimes(2);
            });
        });
    });

  });
});
