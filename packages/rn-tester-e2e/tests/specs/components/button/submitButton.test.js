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

  it('Should click on the Button component', async function () {
    await ComponentsScreen.clickButtonComponent();
  });

  it('Should click the Submit Application button', async function () {
    await ButtonComponentScreen.clickSubmitApplication();
  });

  it('Should verify that the submit alert text is displayed', async function () {
    expect(await ButtonComponentScreen.getSubmitAlertText()).toContain(
      submitText,
    );
  });

  it('Should click the OK button in the alert', async function () {
    await ButtonComponentScreen.clickOkButton();
  });
});
