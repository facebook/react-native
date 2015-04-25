'use strict';

jest.autoMockOff();
var getAssetDataFromName = require('../getAssetDataFromName');

describe('getAssetDataFromName', function() {
  it('should extract resolution simple case', function() {
    var data = getAssetDataFromName('test@2x.png');
    expect(data).toEqual({
      assetName: 'test.png',
      resolution: 2,
      type: 'png',
      name: 'test',
    });
  });

  it('should default resolution to 1', function() {
    var data = getAssetDataFromName('test.png');
    expect(data).toEqual({
      assetName: 'test.png',
      resolution: 1,
      type: 'png',
      name: 'test',
    });
  });

  it('should support float', function() {
    var data = getAssetDataFromName('test@1.1x.png');
    expect(data).toEqual({
      assetName: 'test.png',
      resolution: 1.1,
      type: 'png',
      name: 'test',
    });

    data = getAssetDataFromName('test@.1x.png');
    expect(data).toEqual({
      assetName: 'test.png',
      resolution: 0.1,
      type: 'png',
      name: 'test',
    });

    data = getAssetDataFromName('test@0.2x.png');
    expect(data).toEqual({
      assetName: 'test.png',
      resolution: 0.2,
      type: 'png',
      name: 'test',
    });
  });
});
