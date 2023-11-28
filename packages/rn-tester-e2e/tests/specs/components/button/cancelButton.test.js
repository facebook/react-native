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

describe('Testing Cancel Button Functionality', function () {
  it('Should ensure the Button component is displayed', async function () {
    expect(
      await ComponentsScreen.checkButtonComponentIsDisplayed(),
    ).toBeTruthy();
  });

  it('Should open component and click on Cancel Button then check alert text', async function () {
    await ComponentsScreen.clickButtonComponent();
    await ButtonComponentScreen.clickCancelApplication();
    expect(await ButtonComponentScreen.getCancelAlertText()).toContain(
      cancelText,
    );
  });

  it('Should click the OK button and check if is closed', async function () {
    await ButtonComponentScreen.clickOkButton();
  });
});
