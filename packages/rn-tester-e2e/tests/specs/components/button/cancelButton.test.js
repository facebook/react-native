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

  it('Should click on the Button component', async function () {
    await ComponentsScreen.clickButtonComponent();
  });

  it('Should click the Cancel Application button', async function () {
    await ButtonComponentScreen.clickCancelApplication();
  });

  it('Should view properly submit cancel text', async function () {
    expect(await ButtonComponentScreen.getCancelAlertText()).toContain(
      cancelText,
    );
  });

  it('Should click the OK button', async function () {
    await ButtonComponentScreen.clickOkButton();
  });
});
