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
var File = require('File');
var BlobManager = require('BlobManager');

describe('BlobManager', function() {

  it('should create blob from parts', () => {
    const blob = BlobManager.createFromParts([], { type: 'text/html' });
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe('text/html');
  });

  it('should create file from uri', async () => {
    const file = await BlobManager.createFromURI('file://path/to/a/file', { type: 'text/css' });
    expect(file).toBeInstanceOf(File);
    expect(file.type).toBe('text/css');
  });

});
