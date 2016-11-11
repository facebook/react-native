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
  .unmock('imurmurhash')
  .unmock('../../lib/ModuleTransport')
  .unmock('../');

const fs = {writeFileSync: jest.fn()};
const temp = {path: () => '/arbitrary/path'};
const workerFarm = jest.fn();
jest.setMock('fs', fs);
jest.setMock('temp', temp);
jest.setMock('worker-farm', workerFarm);

var Transformer = require('../');

const {any} = jasmine;

describe('Transformer', function() {
  let options, workers, Cache;
  const fileName = '/an/arbitrary/file.js';
  const transformModulePath = __filename;

  beforeEach(function() {
    Cache = jest.fn();
    Cache.prototype.get = jest.fn((a, b, c) => c());

    fs.writeFileSync.mockClear();
    options = {transformModulePath};
    workerFarm.mockClear();
    workerFarm.mockImpl((opts, path, methods) => {
      const api = workers = {};
      methods.forEach(method => {api[method] = jest.fn();});
      return api;
    });
  });

  it('passes transform module path, file path, source code,' +
    ' and options to the worker farm when transforming', () => {
    const transformOptions = {arbitrary: 'options'};
    const code = 'arbitrary(code)';
    new Transformer(options).transformFile(fileName, code, transformOptions);
    expect(workers.transformAndExtractDependencies).toBeCalledWith(
      transformModulePath,
      fileName,
      code,
      transformOptions,
      any(Function),
    );
  });

  pit('should add file info to parse errors', function() {
    const transformer = new Transformer(options);
    var message = 'message';
    var snippet = 'snippet';

    workers.transformAndExtractDependencies.mockImpl(
      function(transformPath, filename, code, opts, callback) {
        var babelError = new SyntaxError(message);
        babelError.type = 'SyntaxError';
        babelError.description = message;
        babelError.loc = {
          line: 2,
          column: 15,
        };
        babelError.codeFrame = snippet;
        callback(babelError);
      },
    );

    return transformer.transformFile(fileName, '', {})
      .catch(function(error) {
        expect(error.type).toEqual('TransformError');
        expect(error.message).toBe('SyntaxError ' + message);
        expect(error.lineNumber).toBe(2);
        expect(error.column).toBe(15);
        expect(error.filename).toBe(fileName);
        expect(error.description).toBe(message);
        expect(error.snippet).toBe(snippet);
      });
  });
});
