/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 */

'use strict';

const PixelRatio = {
  get: jest.fn().mockReturnValue(2),
  getFontScale: jest.fn(() => PixelRatio.get()),
  getPixelSizeForLayoutSize: jest.fn(layoutSize => Math.round(layoutSize * PixelRatio.get())),
  roundToNearestPixel: jest.fn(layoutSize => {
    const ratio = PixelRatio.get();
    return Math.round(layoutSize * ratio) / ratio;
  }),
  startDetecting: jest.fn(),
};

module.exports = PixelRatio;
