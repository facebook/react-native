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
const submitText = 'Your application has been submitted!';

describe('Test is checking submit button', () => {
  test('Should view properly submit alert text', async () => {
    expect(
      await componentsScreen.checkButtonComponentIsDisplayed(),
    ).toBeTruthy();
    await componentsScreen.clickButtonComponent();
    await buttonComponentScreen.clickSubmitApplication();
    expect(await buttonComponentScreen.getSubmitAlertText()).toContain(
      submitText,
    );
    await buttonComponentScreen.clickOkButton();
  });
});
