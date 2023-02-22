/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

const componentsScreen = require('../screenObjects/components.screen.js');
const buttonComponentScreen = require('../screenObjects/buttonComponent.screen.js');
const cancelText = 'Your application has been cancelled!';

describe('Test is checking cancel button', () => {
  test('Should view properly submit cancel text', async () => {
    expect(
      await componentsScreen.checkButtonComponentIsDisplayed(),
    ).toBeTruthy();
    await componentsScreen.clickButtonComponent();
    await buttonComponentScreen.clickCancelApplication();
    expect(await buttonComponentScreen.getCancelAlertText()).toContain(
      cancelText,
    );
    await buttonComponentScreen.clickOkButton();
  });
});
