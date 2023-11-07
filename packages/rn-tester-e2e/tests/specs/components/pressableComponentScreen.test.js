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
  PressableComponentScreen,
} = require('../../screens/components/pressableComponent.screen.js');

// fixed variables
const onPressText = 'onPress';

describe('Test is checking pressable component', () => {
  test('Should view onPress text', async () => {
    await PressableComponentScreen.scrollUntilPressableComponentIsDisplayed();
    expect(
      await ComponentsScreen.checkPressableComponentIsDisplayed(),
    ).toBeTruthy();
    await ComponentsScreen.clickPressableComponent();
    expect(
      await PressableComponentScreen.checkPressMeHeaderIsDisplayed(),
    ).toBeTruthy();
    await PressableComponentScreen.clickPressMeButton();
    expect(
      await PressableComponentScreen.checkOnPressIsDisplayed(),
    ).toBeTruthy();
    expect(await PressableComponentScreen.getOnPressText()).toContain(
      onPressText,
    );
  });
});
