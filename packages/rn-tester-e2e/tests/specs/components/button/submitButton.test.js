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

describe('Test is checking submit button', function () {
  it('Should view properly submit alert text', async function () {
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
