/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

import {
    UtilsSingleton as Utils,
    iOSLabel,
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
    clickPressMeButton: () => Promise<void>,
    getOnPressText: () => Promise<string>,
};

export const PressableComponentScreen: PressableComponentScreenType = {
    // reference in the Components list
    pressableScreenElement: Utils.platformSelect({
      ios: iOSLabel('Pressable'),
      android: androidWidget('ViewGroup', 'resource-id', 'Pressable'),
    }),
    // References to elements within the Pressable screen
    pressMeHeaderElement: Utils.platformSelect({
      ios: iOSName('Change content based on Press'),
      android: androidWidget('TextView', 'text', 'Change content based on Press'),
    }),
    btnPressMeElement: Utils.platformSelect({
        ios: iOSName('one_press_me_button'),
        android: androidWidget('TextView', 'resource-id', 'one_press_me_button'),
    }),
    onPressText: Utils.platformSelect({
        ios: iOSName('pressable_press_console'),
        android: androidWidget('TextView', 'resource-id', 'pressable_press_console'),
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