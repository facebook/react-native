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

describe('ActionSheetIOS', () => {
  beforeAll(async () => {
    await device.reloadReactNative();
    await openComponentWithLabel(
      'ActionSheetIOS',
      "ActionSheetIOS Interface to show iOS' action sheets",
    );
  });

  it(
    'Should load the correct options for a simple action sheet and behave ' +
      'correctly for all options and clicks outside the frame of the action sheet',
    async () => {
      await openExampleWithTitle('Show Standard Action Sheet');
      await element(by.id('normal-action-sheet')).tap();

      // ensure all items are visible and not covered
      await expect(element(by.text('Option 0'))).toBeVisible();
      await expect(element(by.text('Option 1'))).toBeVisible();
      await expect(element(by.text('Option 2'))).toBeVisible();
      await expect(element(by.text('Delete'))).toBeVisible();

      await element(by.text('Option 0')).tap();

      // ensure all items are hidden when the action sheet is dismissed
      await expect(element(by.text('Option 0'))).toBeNotVisible();
      await expect(element(by.text('Option 1'))).toBeNotVisible();
      await expect(element(by.text('Option 2'))).toBeNotVisible();
      await expect(element(by.text('Delete'))).toBeNotVisible();

      await expect(
        element(by.id('normal-action-sheet-button-status')),
      ).toHaveText('Clicked button: Option 0');

      await element(by.id('normal-action-sheet')).tap();
      await element(by.text('Click to show the ActionSheet')).tap(); //click outside
      await expect(
        element(by.id('normal-action-sheet-button-status')),
      ).toHaveText('Clicked button: Cancel');

      await element(by.id('normal-action-sheet')).tap();
      await element(by.text('Delete')).tap();
      await expect(
        element(by.id('normal-action-sheet-button-status')),
      ).toHaveText('Clicked button: Delete');
    },
  );
});
