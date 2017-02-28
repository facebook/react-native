/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

jest.disableAutomock();
jest.mock('../constant-folding');
jest.mock('../extract-dependencies');
jest.mock('../inline');
jest.mock('../minify');

const {objectContaining} = jasmine;

describe('code transformation worker:', () => {
  let transformCode;

  let extractDependencies, transformer;
  beforeEach(() => {
    jest.resetModules();
    ({transformCode} = require('..'));
    extractDependencies =
      require('../extract-dependencies').mockReturnValue({});
    transformer = {
      transform: jest.fn((src, filename, options) => ({
        code: src,
        map: {},
      })),
    };
  });

  it('calls the transform with file name, source code, and transform options', function() {
    const filename = 'arbitrary/file.js';
    const sourceCode = 'arbitrary(code)';
    const transformOptions = {arbitrary: 'options'};
    transformCode(transformer, filename, sourceCode, {transform: transformOptions}, () => {});
    expect(transformer.transform).toBeCalledWith(
      sourceCode,
      filename,
      transformOptions,
    );
  });

  it('prefixes JSON files with an assignment to module.exports to make the code valid', function() {
    const filename = 'arbitrary/file.json';
    const sourceCode = '{"arbitrary":"property"}';
    transformCode(transformer, filename, sourceCode, {}, () => {});
    expect(transformer.transform).toBeCalledWith(
      `module.exports=${sourceCode}`,
      filename,
      undefined,
    );
  });

  it('calls back with the result of the transform in the cache', done => {
    const result = {
      code: 'some.other(code)',
      map: {},
    };

    transformCode(transformer, 'filename', result.code, {}, (error, data) => {
      expect(error).toBeNull();
      expect(data.result).toEqual(objectContaining(result));
      done();
    });
  });

  it(
    'removes the leading assignment to `module.exports` before passing ' +
    'on the result if the file is a JSON file, even if minified',
    done => {
      const code = '{a:1,b:2}';
      const filePath = 'arbitrary/file.json';
      transformCode(transformer, filePath, code, {}, (error, data) => {
        expect(error).toBeNull();
        expect(data.result.code).toEqual(code);
        done();
      },
      );
    }
  );

  it('removes shebang when present', done => {
    const shebang = '#!/usr/bin/env node';
    const result = {
      code: `${shebang} \n arbitrary(code)`,
    };
    const filePath = 'arbitrary/file.js';
    transformCode(transformer, filePath, result.code, {}, (error, data) => {
      expect(error).toBeNull();
      const {code} = data.result;
      expect(code).not.toContain(shebang);
      expect(code.split('\n').length).toEqual(result.code.split('\n').length);
      done();
    });
  });

  it('calls back with any error yielded by the transform', done => {
    const message = 'SyntaxError: this code is broken.';
    transformer.transform.mockImplementation(() => {
      throw new Error(message);
    });

    transformCode(transformer, 'filename', 'code', {}, error => {
      expect(error.message).toBe(message);
      done();
    });
  });

  describe('dependency extraction', () => {
    it('passes the transformed code the `extractDependencies`', done => {
      const code = 'arbitrary(code)';

      transformCode(transformer, 'filename', code, {}, error => {
        expect(error).toBeNull();
        expect(extractDependencies).toBeCalledWith(code);
        done();
      });
    });

    it(
      'uses `dependencies` and `dependencyOffsets` ' +
      'provided by `extractDependencies` for the result',
      done => {
        const dependencyData = {
          dependencies: ['arbitrary', 'list', 'of', 'dependencies'],
          dependencyOffsets: [12,  119, 185, 328, 471],
        };
        extractDependencies.mockReturnValue(dependencyData);

        transformCode(transformer, 'filename', 'code', {}, (error, data) => {
          expect(error).toBeNull();
          expect(data.result).toEqual(objectContaining(dependencyData));
          done();
        });
      }
    );

    it('does not extract requires if files are marked as "extern"', done => {
      const opts = {extern: true};
      transformCode(transformer, 'filename', 'code', opts, (error, data) => {
        expect(error).toBeNull();
        const {dependencies, dependencyOffsets} = data.result;
        expect(extractDependencies).not.toBeCalled();
        expect(dependencies).toEqual([]);
        expect(dependencyOffsets).toEqual([]);
        done();
      });
    });

    it('does not extract requires of JSON files', done => {
      const jsonStr = '{"arbitrary":"json"}';
      transformCode(transformer, 'arbitrary.json', jsonStr, {}, (error, data) => {
        expect(error).toBeNull();
        const {dependencies, dependencyOffsets} = data.result;
        expect(extractDependencies).not.toBeCalled();
        expect(dependencies).toEqual([]);
        expect(dependencyOffsets).toEqual([]);
        done();
      }
      );
    });
  });

  describe('Minifications:', () => {
    let constantFolding, inline, options;
    let transformResult, dependencyData;
    const filename = 'arbitrary/file.js';
    const foldedCode = 'arbitrary(folded(code));';
    const foldedMap = {version: 3, sources: ['fold.js']};

    beforeEach(() => {
      constantFolding = require('../constant-folding')
        .mockReturnValue({code: foldedCode, map: foldedMap});
      extractDependencies = require('../extract-dependencies');
      inline = require('../inline');

      options = {minify: true, transform: {generateSourceMaps: true}};
      dependencyData = {
        dependencies: ['a', 'b', 'c'],
        dependencyOffsets: [100, 120, 140],
      };

      extractDependencies.mockImplementation(
        code => code === foldedCode ? dependencyData : {});

      transformer.transform.mockImplementation((src, fileName, _) => transformResult);
    });

    it('passes the transform result to `inline` for constant inlining', done => {
      transformResult = {map: {version: 3}, code: 'arbitrary(code)'};
      transformCode(transformer, filename, 'code', options, () => {
        expect(inline).toBeCalledWith(filename, transformResult, options);
        done();
      });
    });

    it('passes the result obtained from `inline` on to `constant-folding`', done => {
      const inlineResult = {map: {version: 3, sources: []}, ast: {}};
      inline.mockReturnValue(inlineResult);
      transformCode(transformer, filename, 'code', options, () => {
        expect(constantFolding).toBeCalledWith(filename, inlineResult);
        done();
      });
    });

    it('Uses the code obtained from `constant-folding` to extract dependencies', done => {
      transformCode(transformer, filename, 'code', options, () => {
        expect(extractDependencies).toBeCalledWith(foldedCode);
        done();
      });
    });

    it('uses the dependencies obtained from the optimized result', done => {
      transformCode(transformer, filename, 'code', options, (_, data) => {
        const result = data.result;
        expect(result.dependencies).toEqual(dependencyData.dependencies);
        done();
      });
    });

    it('uses data produced by `constant-folding` for the result', done => {
      transformCode(transformer, 'filename', 'code', options, (_, data) => {
        expect(data.result)
          .toEqual(objectContaining({code: foldedCode, map: foldedMap}));
        done();
      });
    });
  });
});
