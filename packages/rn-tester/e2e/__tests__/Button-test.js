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
      'Button',
      'Button Simple React Native button component.',
    );
  });

  it('Default Styling button should be tappable', async () => {
    await openExampleWithTitle('Default Styling');
    await element(by.id('button_default_styling')).tap();
    await expect(
      element(by.text('Your application has been submitted!')),
    ).toBeVisible();
    await element(by.text('OK')).tap();
  });

  it('Red color button should be tappable', async () => {
    await openExampleWithTitle('Color');
    await element(by.id('cancel_button')).tap();
    await expect(
      element(by.text('Your application has been cancelled!')),
    ).toBeVisible();
    await element(by.text('OK')).tap();
  });

  it("Two buttons with JustifyContent:'space-between' should be tappable", async () => {
    await openExampleWithTitle('Two Buttons');
    await element(by.id('two_cancel_button')).tap();
    await expect(
      element(by.text('Your application has been cancelled!')),
    ).toBeVisible();
    await element(by.text('OK')).tap();

    await element(by.id('two_submit_button')).tap();
    await expect(
      element(by.text('Your application has been submitted!')),
    ).toBeVisible();
    await element(by.text('OK')).tap();
  });

  it("Three buttons with JustifyContent:'space-between' should be tappable", async () => {
    await openExampleWithTitle('Three Buttons');
    await element(by.id('three_cancel_button')).tap();
    await expect(
      element(by.text('Your application has been cancelled!')),
    ).toBeVisible();
    await element(by.text('OK')).tap();

    await openExampleWithTitle('Three Buttons');
    await element(by.id('three_save_button')).tap();
    await expect(
      element(by.text('Your application has been saved!')),
    ).toBeVisible();
    await element(by.text('OK')).tap();

    await element(by.id('three_submit_button')).tap();
    await expect(
      element(by.text('Your application has been submitted!')),
    ).toBeVisible();
    await element(by.text('OK')).tap();
  });

  it('Disabled button should not interact', async () => {
    await openExampleWithTitle('Disabled');
    await element(by.id('disabled_button')).tap();
    await expect(
      element(by.text('Your application has been submitted!')),
    ).toBeNotVisible();
  });

  it('AccessibilityLabel button should be tappable', async () => {
    await openExampleWithTitle('AccessibilityLabel');
    await element(by.id('accessibilityLabel_button')).tap();
    await expect(
      element(by.text('Your application has been submitted!')),
    ).toBeVisible();
    await element(by.text('OK')).tap();
  });
});
