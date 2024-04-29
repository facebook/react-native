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

type NewAppComponentScreenType = {
  newAppScreenElement: string,
  newAppHeaderScreenElement: string,
  scrollUntilNewAppHeaderComponentIsDisplayed: () => Promise<void>,
  checkNewAppHeaderIsDisplayed: () => Promise<boolean>,
};

const newAppScreenText = 'New App Screen';
const newAppScreenHeaderText = 'New App Screen Header';

export const NewAppComponentScreen: NewAppComponentScreenType = {
  // reference in the Components list
  newAppScreenElement: Utils.platformSelect({
    ios: iOSName(newAppScreenText),
    android: androidWidget('TextView', 'text', newAppScreenText),
  }),
  // References to elements within the New App Component screenS
  newAppHeaderScreenElement: Utils.platformSelect({
    ios: iOSName(newAppScreenHeaderText),
    android: androidWidget('TextView', 'text', newAppScreenHeaderText),
  }),
  // Methods to interact with the elements
  scrollUntilNewAppHeaderComponentIsDisplayed: async function (
    this: NewAppComponentScreenType,
  ): Promise<void> {
    return await Utils.scrollToElement(this.newAppScreenElement);
  },
  checkNewAppHeaderIsDisplayed: async function (
    this: NewAppComponentScreenType,
  ): Promise<boolean> {
    return await Utils.checkElementExistence(this.newAppHeaderScreenElement);
  },
};
