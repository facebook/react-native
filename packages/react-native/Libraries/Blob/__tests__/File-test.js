/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @oncall react_native
 */

'use strict';

jest.setMock('../../BatchedBridge/NativeModules', {
  __esModule: true,
  default: {
    BlobModule: require('../__mocks__/BlobModule'),
  },
});

const Blob = require('../Blob');
const File = require('../File');

describe('babel 7 smoke test', function () {
  it('should be able to extend a class with native name', function () {
    let called = false;
    class Array {
      constructor() {
        called = true;
        return {foo: 'PASS'};
      }
    }
    class A extends Array {
      constructor() {
        super();
      }
    }

    // there is/was a regression in Babel where this would break and super()
    // would not actually invoke the constructor of the parent class if the
    // parent class had a name matching a built-in class (like Blob)
    expect(new A().foo).toBe('PASS');
    expect(called).toBe(true);
  });
});

describe('Blob', function () {
  it('regression caused by circular dep && babel 7', function () {
    const blob = new Blob([], {type: 'image/jpeg'});
    expect(blob).toBeInstanceOf(Blob);
  });
});

describe('File', function () {
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
