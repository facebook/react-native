/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

const {ComponentsScreen} = require('../../../screens/components.screen.js');
const {
  ButtonComponentScreen,
} = require('../../../screens/components/buttonComponent.screen.js');

const cancelText = 'Your application has been cancelled!';

describe('Test is checking cancel button', function () {
  it('Should view properly submit cancel text', async function () {
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
