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

const submitText = 'Your application has been submitted!';

describe('Testing Submit Button functionality ', function () {
  it('Should ensure the Button component is displayed', async function () {
    expect(
      await ComponentsScreen.checkButtonComponentIsDisplayed(),
    ).toBeTruthy();
  });

  it('Should open component and click on Submit Button then check alert text', async function () {
    await ComponentsScreen.clickButtonComponent();
    await ButtonComponentScreen.clickSubmitApplication();
    expect(await ButtonComponentScreen.getSubmitAlertText()).toContain(
      submitText,
    );
  });

  it('Should click the OK button in the alert', async function () {
    await ButtonComponentScreen.clickOkButton();
  });
});
