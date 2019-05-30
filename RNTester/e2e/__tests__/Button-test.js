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

describe('Button', () => {
  beforeAll(async () => {
    await device.reloadReactNative();
    await openComponentWithLabel(
      '<Button>',
      '<Button> Simple React Native button component.',
    );
  });

  it('Simple button should be tappable', async () => {
    await openExampleWithTitle('Simple Button');
    await element(by.id('simple_button')).tap();
    await expect(element(by.text('Simple has been pressed!'))).toBeVisible();
    await element(by.text('OK')).tap();
  });

  it('Adjusted color button should be tappable', async () => {
    await openExampleWithTitle('Adjusted color');
    await element(by.id('purple_button')).tap();
    await expect(element(by.text('Purple has been pressed!'))).toBeVisible();
    await element(by.text('OK')).tap();
  });

  it("Two buttons with JustifyContent:'space-between' should be tappable", async () => {
    await openExampleWithTitle('Fit to text layout');
    await element(by.id('left_button')).tap();
    await expect(element(by.text('Left has been pressed!'))).toBeVisible();
    await element(by.text('OK')).tap();

    await element(by.id('right_button')).tap();
    await expect(element(by.text('Right has been pressed!'))).toBeVisible();
    await element(by.text('OK')).tap();
  });

  it('Disabled button should not interact', async () => {
    await openExampleWithTitle('Disabled Button');
    await element(by.id('disabled_button')).tap();
    await expect(
      element(by.text('Disabled has been pressed!')),
    ).toBeNotVisible();
  });
});
