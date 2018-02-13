/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @format
 * @emails oncall+react_native
 */
'use strict';

jest.setMock('NativeModules', {
  BlobModule: require('../__mocks__/BlobModule'),
});

const File = require('File');

describe('File', function() {
  it('should create empty file', () => {
    const file = new File([], 'test.jpg');
    expect(file).toBeInstanceOf(File);
    expect(file.data.offset).toBe(0);
    expect(file.data.size).toBe(0);
    expect(file.size).toBe(0);
    expect(file.type).toBe('');
    expect(file.name).toBe('test.jpg');
    expect(file.lastModified).toEqual(expect.any(Number));
  });

  it('should create empty file with type', () => {
    const file = new File([], 'test.jpg', {type: 'image/jpeg'});
    expect(file.type).toBe('image/jpeg');
  });

  it('should create empty file with lastModified', () => {
    const file = new File([], 'test.jpg', {lastModified: 1337});
    expect(file.lastModified).toBe(1337);
  });

  it('should throw on invalid arguments', () => {
    expect(() => new File()).toThrow();
    expect(() => new File([])).toThrow();
  });
});
