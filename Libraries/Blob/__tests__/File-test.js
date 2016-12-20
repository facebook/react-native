/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 */
'use strict';

jest
  .unmock('File')
  .unmock('Blob')
  .unmock('BlobManager')
  .unmock('../__mocks__/BlobModule')
  .setMock('NativeModules', {
    BlobModule: require('../__mocks__/BlobModule'),
  });

var File = require('File');

describe('File', function() {

  it('should create empty file', () => {
    const file = new File();
    expect(file).toBeInstanceOf(File);
    expect(file.data.offset).toBe(0);
    expect(file.data.size).toBe(0);
    expect(file.size).toBe(0);
    expect(file.type).toBe('');
    expect(file.name).toBe('');
    expect(file.lastModified).toBe(0);
  });

  it('should create empty file with type', () => {
    const file = new File([], { type: 'image/jpeg' });
    expect(file.type).toBe('image/jpeg');
  });

});
