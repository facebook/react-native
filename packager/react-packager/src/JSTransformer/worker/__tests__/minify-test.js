/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

jest.autoMockOff();

const uglify = {
  minify: jest.genMockFunction().mockImplementation(code => {
    return {
      code: code.replace(/(^|\W)\s+/g, '$1'),
      map: {},
    };
  }),
};
jest.setMock('uglify-js', uglify);

const minify = require('../minify');
const {any} = jasmine;

describe('Minification:', () => {
  const fileName = '/arbitrary/file.js';
  const DEPENDENCY_MARKER = '\u0002\ueffe\ue277\uead5';
  let map;

  beforeEach(() => {
    uglify.minify.mockClear();
    map = {version: 3, sources: [fileName], mappings: ''};
  });

  it('passes the transformed code to `uglify.minify`, wrapped in an immediately invoked function expression', () => {
    const code = 'arbitrary(code)';
    minify('', code, {}, [], []);
    expect(uglify.minify).toBeCalledWith(
      `(function(){${code}}());`, any(Object));
  });

  it('uses the passed module locals as parameters of the IIFE', () => {
    const moduleLocals = ['arbitrary', 'parameters'];
    minify('', '', {}, [], moduleLocals);
    expect(uglify.minify).toBeCalledWith(
      `(function(${moduleLocals}){}());`, any(Object));
  });

  it('passes the transformed source map to `uglify.minify`', () => {
    minify('', '', map, [], []);
    const [, options] = uglify.minify.mock.calls[0];
    expect(options.inSourceMap).toEqual(map);
  });

  it('passes the file name as `outSourceMap` to `uglify.minify` (uglify uses it for the `file` field on the source map)', () => {
    minify(fileName, '', {}, [], []);
    const [, options] = uglify.minify.mock.calls[0];
    expect(options.outSourceMap).toEqual(fileName);
  });

  it('inserts a marker for every dependency offset before minifing', () => {
    const code = `
      var React = require('React');
      var Immutable = require('Immutable');`;
    const dependencyOffsets = [27, 67];
    const expectedCode =
      code.replace(/require\('/g, '$&' + DEPENDENCY_MARKER);

    minify('', code, {}, dependencyOffsets, []);
    expect(uglify.minify).toBeCalledWith(
      `(function(){${expectedCode}}());`, any(Object));
  });

  it('returns the code provided by uglify', () => {
    const code = 'some(source) + code';
    uglify.minify.mockReturnValue({code: `!function(a,b,c){${code}}()`});

    const result = minify('', '', {}, [], []);
    expect(result.code).toBe(code);
  });

  it('extracts dependency offsets from the code provided by uglify', () => {
    const code = `
      var a=r("${DEPENDENCY_MARKER}a-dependency");
      var b=r("\\x02\\ueffe\\ue277\\uead5b-dependency");
      var e=r(a()?'\\u0002\\ueffe\\ue277\\uead5c-dependency'
                 :'\x02\ueffe\ue277\uead5d-dependency');`;
    uglify.minify.mockReturnValue({code: `!function(){${code}}());`});

    const result = minify('', '', {}, [], []);
    expect(result.dependencyOffsets).toEqual([15, 46, 81, 114]);
  });

  it('returns the source map object provided by uglify', () => {
    uglify.minify.mockReturnValue({map, code: ''});
    const result = minify('', '', {}, [], []);
    expect(result.map).toBe(map);
  });

  it('adds a `moduleLocals` object to the result that reflects the names of the minified module locals', () => {
    const moduleLocals = ['arbitrary', 'parameters', 'here'];
    uglify.minify.mockReturnValue({code: '(function(a,ll,d){}());'});
    const result = minify('', '', {}, [], moduleLocals);
    expect(result.moduleLocals).toEqual({
      arbitrary: 'a',
      parameters: 'll',
      here: 'd',
    });
  });
});
