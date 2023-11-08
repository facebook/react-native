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
  it('Should scroll until the Pressable component is displayed', async function () {
    await PressableComponentScreen.scrollUntilPressableComponentIsDisplayed();
  });

  it('Should ensure the Pressable component is visible', async function () {
    expect(
      await ComponentsScreen.checkPressableComponentIsDisplayed(),
    ).toBeTruthy();
  });

  it('Should click on the Pressable component', async function () {
    await ComponentsScreen.clickPressableComponent();
  });

  it('Should display the Press Me header', async function () {
    expect(
      await PressableComponentScreen.checkPressMeHeaderIsDisplayed(),
    ).toBeTruthy();
  });

  it('Should click the Press Me button', async function () {
    await PressableComponentScreen.clickPressMeButton();
  });

  it('Should check if onPress text is displayed', async function () {
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
