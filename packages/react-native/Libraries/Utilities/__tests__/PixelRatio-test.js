/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @emails oncall+react_native
 */

'use strict';

describe('PixelRatio', () => {
  const Dimensions = require('../Dimensions');
  const PixelRatio = require('../PixelRatio');

  beforeEach(() => {
    Dimensions.set({
      windowPhysicalPixels: {
        width: 400,
        height: 800,
        scale: 2,
        fontScale: 3,
      },
    });
  });

  it('should give the pixel density', () => {
    expect(PixelRatio.get()).toEqual(2);
  });

  it('should give the font scale when present', () => {
    expect(PixelRatio.getFontScale()).toEqual(3);
  });

  it('should give the pixel density instead of the font scale when the front scale is not present', () => {
    Dimensions.set({
      windowPhysicalPixels: {
        scale: 2,
      },
    });
    expect(PixelRatio.getFontScale()).toEqual(2);
  });

  it('should convert a layout size to pixel size', () => {
    expect(PixelRatio.getPixelSizeForLayoutSize(400)).toEqual(800);
  });

  it('should round a layout size to pixel size', () => {
    expect(PixelRatio.roundToNearestPixel(8.4)).toEqual(8.5);
  });
});
