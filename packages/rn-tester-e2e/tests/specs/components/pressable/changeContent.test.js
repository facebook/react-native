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
  PressableComponentScreen,
} = require('../../../screens/components/pressableComponent.screen.js');

// fixed variables
const onPressText = 'onPress';

describe('Testing Press Me button of Change conent based on Press Functionality', function () {
  it('Should search for Pressable component and check if is displayed', async function () {
    await ComponentsScreen.setValueToSearch('Pressable');
    expect(
      await ComponentsScreen.checkPressableComponentIsDisplayed(),
    ).toBeTruthy();
  });

  it('Should open the Pressable component and heck if header is displayed', async function () {
    await ComponentsScreen.clickPressableComponent();
    expect(
      await PressableComponentScreen.checkPressMeHeaderIsDisplayed(),
    ).toBeTruthy();
  });

  it('Should click the Press Me button and check if onPress text is displayed', async function () {
    await PressableComponentScreen.clickPressMeButton();
    expect(
      await PressableComponentScreen.checkOnPressIsDisplayed(),
    ).toBeTruthy();
  });

  it('Should verify the onPress text content', async function () {
    expect(await PressableComponentScreen.getOnPressText()).toContain(
      onPressText,
    );
  });
});
