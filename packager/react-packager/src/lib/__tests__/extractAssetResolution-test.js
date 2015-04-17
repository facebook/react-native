'use strict';

jest.autoMockOff();
var extractAssetResolution = require('../extractAssetResolution');

describe('extractAssetResolution', function() {
  it('should extract resolution simple case', function() {
    var data = extractAssetResolution('test@2x.png');
    expect(data).toEqual({
      assetName: 'test.png',
      resolution: 2,
    });
  });

  it('should default resolution to 1', function() {
    var data = extractAssetResolution('test.png');
    expect(data).toEqual({
      assetName: 'test.png',
      resolution: 1,
    });
  });

  it('should support float', function() {
    var data = extractAssetResolution('test@1.1x.png');
    expect(data).toEqual({
      assetName: 'test.png',
      resolution: 1.1,
    });

    data = extractAssetResolution('test@.1x.png');
    expect(data).toEqual({
      assetName: 'test.png',
      resolution: 0.1,
    });

    data = extractAssetResolution('test@0.2x.png');
    expect(data).toEqual({
      assetName: 'test.png',
      resolution: 0.2,
    });
  });
});
