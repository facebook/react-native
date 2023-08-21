/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

const {ComponentsScreen} = require('../../screens/components.screen.js');
const {
  RefreshControlComponentScreen,
} = require('../../screens/components/refreshControlComponent.screen.js');

// // fixed variables
const onPressText = 'onPress';

describe('Test is checking RefreshControl component', () => {
  test('Should view onPress text', async () => {
    await RefreshControlComponentScreen.scrollUntilRefreshControlComponentIsDisplayed();
    expect(
      await ComponentsScreen.checkRefreshControlComponentIsDisplayed(),
    ).toBeTruthy();
    await ComponentsScreen.clickRefreshControlComponent();
    // expect(
    //   await PressableComponentScreen.checkPressMeHeaderIsDisplayed(),
    // ).toBeTruthy();
    // await PressableComponentScreen.clickPressMeButton();
    // expect(
    //   await PressableComponentScreen.checkOnPressIsDisplayed(),
    // ).toBeTruthy();
    // expect(await PressableComponentScreen.getOnPressText()).toContain(
    //   onPressText,
    // );
  });
});
