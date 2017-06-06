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

var Blob = require('Blob');
var BlobManager = require('BlobManager');

describe('BlobManager', function() {

  it('should create blob from parts', () => {
    const blob = BlobManager.createFromParts([], { type: 'text/html' });
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe('text/html');
  });

});
