/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 */

'use strict';

const PixelRatio = {
  get: jest.genMockFunction().mockReturnValue(2),
  getFontScale: jest.genMockFunction().mockImplementation(
    () => PixelRatio.get()
  ),
  getPixelSizeForLayoutSize: jest.genMockFunction().mockImplementation(
    layoutSize => Math.round(layoutSize * PixelRatio.get())
  ),
  roundToNearestPixel: jest.genMockFunction().mockImplementation(
    layoutSize => {
      const ratio = PixelRatio.get();
      return Math.round(layoutSize * ratio) / ratio;
    }
  ),
  startDetecting: jest.genMockFunction(),
};

module.exports = PixelRatio;
