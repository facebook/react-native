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
  NewAppComponentScreen,
} = require('../../screens/components/newAppComponent.screen.js');

describe('Test is checking new app screen component', () => {
  test('Should view new app header element', async () => {
    await NewAppComponentScreen.scrollUntilNewAppHeaderComponentIsDisplayed();
    expect(
      await ComponentsScreen.checkNewAppScreenComponentIsDisplayed(),
    ).toBeTruthy();
    await ComponentsScreen.clickNewAppScreenComponent();
    expect(
      await NewAppComponentScreen.checkNewAppHeaderIsDisplayed(),
    ).toBeTruthy();
  });
});
