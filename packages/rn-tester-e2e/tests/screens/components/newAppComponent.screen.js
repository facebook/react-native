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

type NewAppComponentScreenType = {
  newAppScreenElement: string,
  newAppHeaderScreenElement: string,
  checkNewAppHeaderIsDisplayed: () => Promise<boolean>,
};

export const NewAppComponentScreen: NewAppComponentScreenType = {
  // reference in the Components list
  newAppScreenElement: Utils.platformSelect({
    ios: iOSLabel('New App Screen'),
    android: androidWidget('ViewGroup', 'resource-id', 'New App Screen'),
  }),
  // References to elements within the New App Component screen
  newAppHeaderScreenElement: Utils.platformSelect({
    ios: iOSName('New App Screen Header'),
    android: androidWidget('TextView', 'text', 'New App Screen Header'),
  }),
  // Methods to interact with the elements
  checkNewAppHeaderIsDisplayed: async function (
    this: NewAppComponentScreenType,
  ): Promise<boolean> {
    return await Utils.checkElementExistence(this.newAppHeaderScreenElement);
  },
};
