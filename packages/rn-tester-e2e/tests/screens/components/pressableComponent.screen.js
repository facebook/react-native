/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import {
  UtilsSingleton as Utils,
  androidWidget,
  iOSName,
} from '../../helpers/utils';

type PressableComponentScreenType = {
  pressableScreenElement: string,
  pressMeHeaderElement: string,
  btnPressMeElement: string,
  onPressText: string,
  checkPressMeHeaderIsDisplayed: () => Promise<boolean>,
  checkOnPressIsDisplayed: () => Promise<boolean>,
  scrollUntilPressableComponentIsDisplayed: () => Promise<void>,
  clickPressMeButton: () => Promise<void>,
  getOnPressText: () => Promise<string>,
};

const pressMeHeaderText = 'Change content based on Press';

export const PressableComponentScreen: PressableComponentScreenType = {
  // reference in the Components list
  pressableScreenElement: Utils.platformSelect({
    ios: iOSName('Pressable'),
    android: androidWidget('TextView', 'text', 'Pressable'),
  }),
  // References to elements within the Pressable Component screen
  pressMeHeaderElement: Utils.platformSelect({
    ios: iOSName(pressMeHeaderText),
    android: androidWidget('TextView', 'text', pressMeHeaderText),
  }),
  btnPressMeElement: Utils.platformSelect({
    ios: iOSName('one_press_me_button'),
    android: androidWidget('TextView', 'resource-id', 'one_press_me_button'),
  }),
  onPressText: Utils.platformSelect({
    ios: iOSName('pressable_press_console'),
    android: androidWidget(
      'TextView',
      'resource-id',
      'pressable_press_console',
    ),
  }),
  // Methods to interact with the elements
  checkPressMeHeaderIsDisplayed: async function (
    this: PressableComponentScreenType,
  ): Promise<boolean> {
    return await Utils.checkElementExistence(this.pressMeHeaderElement);
  },
  checkOnPressIsDisplayed: async function (
    this: PressableComponentScreenType,
  ): Promise<boolean> {
    return await Utils.checkElementExistence(this.onPressText);
  },
  scrollUntilPressableComponentIsDisplayed: async function (
    this: PressableComponentScreenType,
  ): Promise<void> {
    return await Utils.scrollToElement(this.pressableScreenElement);
  },
  clickPressMeButton: async function (
    this: PressableComponentScreenType,
  ): Promise<void> {
    await Utils.clickElement(this.btnPressMeElement);
  },
  getOnPressText: async function (
    this: PressableComponentScreenType,
  ): Promise<string> {
    return await Utils.getElementText(this.onPressText);
  },
};
