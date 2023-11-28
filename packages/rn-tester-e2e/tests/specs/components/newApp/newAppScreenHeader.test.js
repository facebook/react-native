/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

const {ComponentsScreen} = require('../../../screens/components.screen.js');
const {
  NewAppComponentScreen,
} = require('../../../screens/components/newAppComponent.screen.js');

describe('Testing New App Screen Header Visibility', function () {
  it('Should scroll until the New App Header component and check displayed', async function () {
    await NewAppComponentScreen.scrollUntilNewAppHeaderComponentIsDisplayed();
    expect(
      await ComponentsScreen.checkNewAppScreenComponentIsDisplayed(),
    ).toBeTruthy();
  });

  it('Should open the New App Screen component and verify if displayed correctly', async function () {
    await ComponentsScreen.clickNewAppScreenComponent();
    expect(
      await NewAppComponentScreen.checkNewAppHeaderIsDisplayed(),
    ).toBeTruthy();
  });
});
