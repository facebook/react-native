/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

const PixelRatio = {
  get: jest.fn().mockReturnValue(2),
  getFontScale: jest.fn(() => PixelRatio.get()),
  getPixelSizeForLayoutSize: jest.fn(layoutSize =>
    Math.round(layoutSize * PixelRatio.get()),
  ),
  roundToNearestPixel: jest.fn(layoutSize => {
    const ratio = PixelRatio.get();
    return Math.round(layoutSize * ratio) / ratio;
  }),
  startDetecting: jest.fn(),
};

export default PixelRatio;
