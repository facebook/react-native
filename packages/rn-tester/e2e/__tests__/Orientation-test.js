/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+react_native
 * @format
 */

/* global device, element, by, expect */
const {
  openComponentWithLabel,
  openExampleWithTitle,
} = require('../e2e-helpers');

describe('Orientation', () => {
  beforeEach(async() => {
    await device.reloadReactNative();
    await openComponentWithLabel(
      'OrientationChangeExample',
      'listening to orientation changes',
    );
  });

  it('OrientationLandscape', async () => {
    await device.setOrientation('landscape');

    await expect(element(by.id('currentOrientation'))).toHaveText('Landscape');
  });

  it('OrientationPortrait', async() => {
    await device.setOrientation('landscape');
    await device.setOrientation('portrait');

    await expect(element(by.id('currentOrientation'))).toHaveText('Portrait');
  });
});
