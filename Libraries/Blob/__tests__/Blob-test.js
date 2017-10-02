/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @format
 */
'use strict';

jest.setMock('NativeModules', {
  BlobModule: require('../__mocks__/BlobModule'),
});

var Blob = require('Blob');

describe('Blob', function() {
  it('should create empty blob', () => {
    const blob = new Blob();
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.data.offset).toBe(0);
    expect(blob.data.size).toBe(0);
    expect(blob.size).toBe(0);
    expect(blob.type).toBe('');
  });

  it('should create blob from other blobs and strings', () => {
    const blobA = new Blob();
    const blobB = new Blob();
    const textA = 'i ♥ dogs';
    const textB = '𐀀';
    const textC =
      'Z͑ͫ̓ͪ̂ͫ̽͏̴̙̤̞͉͚̯̞̠͍A̴̵̜̰͔ͫ͗͢L̠ͨͧͩ͘G̴̻͈͍͔̹̑͗̎̅͛́Ǫ̵̹̻̝̳͂̌̌͘!͖̬̰̙̗̿̋ͥͥ̂ͣ̐́́͜͞';

    blobA.data.size = 34540;
    blobB.data.size = 65452;

    const blob = new Blob([blobA, blobB, textA, textB, textC]);

    expect(blob.size).toBe(
      blobA.size +
        blobB.size +
        global.Buffer.byteLength(textA, 'UTF-8') +
        global.Buffer.byteLength(textB, 'UTF-8') +
        global.Buffer.byteLength(textC, 'UTF-8'),
    );
    expect(blob.type).toBe('');
  });

  it('should slice a blob', () => {
    const blob = new Blob();

    blob.data.size = 34546;

    const sliceA = blob.slice(0, 2354);

    expect(sliceA.data.offset).toBe(0);
    expect(sliceA.size).toBe(2354);
    expect(sliceA.type).toBe('');

    const sliceB = blob.slice(2384, 7621);

    expect(sliceB.data.offset).toBe(2384);
    expect(sliceB.size).toBe(7621 - 2384);
    expect(sliceB.type).toBe('');
  });

  it('should close a blob', () => {
    const blob = new Blob();

    blob.close();

    expect(() => blob.size).toThrow();
  });
});
