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

describe('Picker', () => {
  beforeAll(async () => {
    await device.reloadReactNative();
    await openComponentWithLabel(
      '<Picker>',
      '<Picker> Provides multiple options to choose from, using either a dropdown menu or a dialog.',
    );
  });

  it('should be selectable by ID', async () => {
    await openExampleWithTitle('Basic picker');
    await expect(element(by.id('basic-picker'))).toBeVisible();
  });
});
