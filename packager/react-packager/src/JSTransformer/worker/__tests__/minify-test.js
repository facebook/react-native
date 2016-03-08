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
const {objectContaining} = jasmine;

describe('Minification:', () => {
  const filename = '/arbitrary/file.js';
  const code = 'arbitrary(code)';
  let map;

  beforeEach(() => {
    uglify.minify.mockClear();
    uglify.minify.mockReturnValue({code: '', map: '{}'});
    map = {version: 3, sources: ['?'], mappings: ''};
  });

  it('passes file name, code, and source map to `uglify`', () => {
    minify(filename, code, map);
    expect(uglify.minify).toBeCalledWith(code, objectContaining({
      fromString: true,
      inSourceMap: map,
      outSourceMap: true,
    }));
  });

  it('returns the code provided by uglify', () => {
    uglify.minify.mockReturnValue({code, map: '{}'});
    const result = minify('', '', {});
    expect(result.code).toBe(code);
  });

  it('parses the source map object provided by uglify and sets the sources property', () => {
    uglify.minify.mockReturnValue({map: JSON.stringify(map), code: ''});
    const result = minify(filename, '', {});
    expect(result.map).toEqual({...map, sources: [filename]});
  });
});
