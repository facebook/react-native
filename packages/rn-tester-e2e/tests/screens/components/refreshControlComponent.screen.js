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

type RefreshControlComponentScreenType = {
  refreshControlScreenElement: string,
  defaultActivityIndicatorScreenElement: string,
  checkDefaultActivityIndicatorIsDisplayed: () => Promise<boolean>,
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
    defaultActivityIndicatorScreenElement: Utils.platformSelect({
      ios: iOSLabel('Wait for content to load!'),
      android: androidWidget(
        'FrameLayout',
        'content-desc',
        'Wait for content to load!',
      ),
    }),
    // Methods to interact with the elements
    checkDefaultActivityIndicatorIsDisplayed: async function (
      this: ActivityIndicatorComponentScreenType,
    ): Promise<boolean> {
      return await Utils.checkElementExistence(
        this.defaultActivityIndicatorScreenElement,
      );
    },
    scrollUntilRefreshControlComponentIsDisplayed: async function (
      this: ComponentsScreenType,
    ): Promise<void> {
      return await Utils.scrollToElement(this.refreshControlScreenElement);
    },
  };
