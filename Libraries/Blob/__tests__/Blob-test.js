/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 */
'use strict';

jest
  .unmock('Blob')
  .unmock('BlobManager')
  .unmock('../__mocks__/BlobModule')
  .setMock('NativeModules', {
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

  it('should create blob from other blobs', () => {
    const blobA = new Blob();
    const blobB = new Blob();

    blobA.data.size = 34546;
    blobB.data.size = 65453;

    const blob = new Blob([ blobA, blobB ]);

    expect(blob.size).toBe(99999);
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

});
