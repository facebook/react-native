/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 */
'use strict';

jest
  .disableAutomock()
  .unmock('event-target-shim')
  .setMock('NativeModules', {
    BlobModule: require('../__mocks__/BlobModule'),
    FileReaderModule: require('../__mocks__/FileReaderModule'),
  })
  .setMock('Platform', {
    OS: 'android' // remove when iOS is implemented
  });

var Blob = require('Blob');
var FileReader = require('FileReader');

describe('FileReader', function() {

  it('should read blob as text', async () => {
    const e = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = resolve;
      reader.onerror = reject;
      reader.readAsText(new Blob());
    });
    expect(e.target.result).toBe('');
  });

  it('should read blob as data URL', async () => {
    const e = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = resolve;
      reader.onerror = reject;
      reader.readAsDataURL(new Blob());
    });
    expect(e.target.result).toBe('data:text/plain;base64,NDI=');
  });

});
