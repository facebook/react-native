/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

const {ComponentsScreen} = require('../../screens/components.screen.js');
const {
  ButtonComponentScreen,
} = require('../../screens/components/buttonComponent.screen.js');

// fixed variables
const submitText = 'Your application has been submitted!';
const cancelText = 'Your application has been cancelled!';

describe('Test is checking submit button', () => {
  test('Should view properly submit alert text', async () => {
    expect(
      await ComponentsScreen.checkButtonComponentIsDisplayed(),
    ).toBeTruthy();
    await ComponentsScreen.clickButtonComponent();
    await ButtonComponentScreen.clickSubmitApplication();
    expect(await ButtonComponentScreen.getSubmitAlertText()).toContain(
      submitText,
    );
    await ButtonComponentScreen.clickOkButton();
  });
});

describe('Test is checking cancel button', () => {
  test('Should view properly submit cancel text', async () => {
    expect(
      await ComponentsScreen.checkButtonComponentIsDisplayed(),
    ).toBeTruthy();
    await ComponentsScreen.clickButtonComponent();
    await ButtonComponentScreen.clickCancelApplication();
    expect(await ButtonComponentScreen.getCancelAlertText()).toContain(
      cancelText,
    );
    await ButtonComponentScreen.clickOkButton();
  });
});
