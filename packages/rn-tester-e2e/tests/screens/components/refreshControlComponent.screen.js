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

type RefreshControlComponentScreenType = {
  refreshControlScreenElement: string,
  initialRowScreenElement: string,
  checkInitialRowIsDisplayed: () => Promise<boolean>,
  scrollUntilRefreshControlComponentIsDisplayed: () => Promise<void>,
};

export const RefreshControlComponentScreen: RefreshControlComponentScreenType =
  {
    // reference in the Components list
    refreshControlScreenElement: Utils.platformSelect({
      ios: iOSName('RefreshControl'),
      android: androidWidget('TextView', 'text', 'RefreshControl'),
    }),
    // References to elements within the RefreshControl Component screen
    initialRowScreenElement: Utils.platformSelect({
      ios: iOSName('refresh_control_row'),
      android: androidWidget('TextView', 'resource-id', 'refresh_control_row'),
    }),
    // Methods to interact with the elements
    checkInitialRowIsDisplayed: async function (
      this: RefreshControlComponentScreenType,
    ): Promise<boolean> {
      return await Utils.checkElementExistence(this.initialRowScreenElement);
    },
    scrollUntilRefreshControlComponentIsDisplayed: async function (
      this: RefreshControlComponentScreenType,
    ): Promise<void> {
      return await Utils.scrollToElement(this.refreshControlScreenElement);
    },
  };
