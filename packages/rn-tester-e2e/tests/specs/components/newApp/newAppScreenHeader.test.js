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
  it('Should scroll until the New App Header component is displayed', async function () {
    await NewAppComponentScreen.scrollUntilNewAppHeaderComponentIsDisplayed();
  });

  it('Should check that the New App Screen component is displayed', async function () {
    expect(
      await ComponentsScreen.checkNewAppScreenComponentIsDisplayed(),
    ).toBeTruthy();
  });

  it('Should click on the New App Screen component', async function () {
    await ComponentsScreen.clickNewAppScreenComponent();
  });

  it('Should verify that the New App Header is displayed', async function () {
    expect(
      await NewAppComponentScreen.checkNewAppHeaderIsDisplayed(),
    ).toBeTruthy();
  });
});
