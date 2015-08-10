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
  .dontMock('worker-farm')
  .dontMock('../../lib/ModuleTransport')
  .dontMock('../index');

jest.mock('fs');

var Cache = require('../../Cache');

var OPTIONS = {
  transformModulePath: '/foo/bar',
  cache: new Cache({}),
};

describe('Transformer', function() {
  var Transformer;
  var workers;

  beforeEach(function() {
    workers = jest.genMockFn();
    jest.setMock('worker-farm', jest.genMockFn().mockImpl(function() {
      return workers;
    }));
    require('fs').readFile.mockImpl(function(file, callback) {
      callback(null, 'content');
    });
    Transformer = require('../');
  });

  pit('should loadFileAndTransform', function() {
    workers.mockImpl(function(data, callback) {
      callback(null, { code: 'transformed', map: 'sourceMap' });
    });
    require('fs').readFile.mockImpl(function(file, callback) {
      callback(null, 'content');
    });

    return new Transformer(OPTIONS).loadFileAndTransform('file')
      .then(function(data) {
        expect(data).toEqual({
          code: 'transformed',
          map: 'sourceMap',
          sourcePath: 'file',
          sourceCode: 'content'
        });
      });
  });

  pit('should add file info to parse errors', function() {
    var message = 'message';
    var snippet = 'snippet';

    require('fs').readFile.mockImpl(function(file, callback) {
      callback(null, 'var x;\nvar answer = 1 = x;');
    });

    workers.mockImpl(function(data, callback) {
      var babelError = new SyntaxError(message);
      babelError.type = 'SyntaxError';
      babelError.description = message;
      babelError.loc = {
        line: 2,
        column: 15,
      };
      babelError.codeFrame = snippet;
      callback(babelError);
    });

    return new Transformer(OPTIONS).loadFileAndTransform('foo-file.js')
      .catch(function(error) {
        expect(error.type).toEqual('TransformError');
        expect(error.message).toBe('SyntaxError ' + message);
        expect(error.lineNumber).toBe(2);
        expect(error.column).toBe(15);
        expect(error.filename).toBe('foo-file.js');
        expect(error.description).toBe(message);
        expect(error.snippet).toBe(snippet);
      });
  });
});
