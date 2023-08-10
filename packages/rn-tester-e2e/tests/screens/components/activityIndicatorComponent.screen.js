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
  } from '../../helpers/utils';


type ActivityIndicatorComponentScreenType = {
    activityIndicatorScreenElement: string,
    defaultActivityIndicatorScreenElement: string,
    checkDefaultActivityIndicatorIsDisplayed: () => Promise<boolean>,
  };

export const ActivityIndicatorComponentScreen: ActivityIndicatorComponentScreenType = {
    // reference in the Components list
    activityIndicatorScreenElement: Utils.platformSelect({
      ios: iOSLabel('ActivityIndicator'),
      android: androidWidget('ViewGroup', 'resource-id', 'ActivityIndicator'),
    }),
    // References to elements within the Activity Indicator Component screen
    defaultActivityIndicatorScreenElement: Utils.platformSelect({
      ios: iOSLabel('Wait for content to load!'),
      android: androidWidget('FrameLayout', 'content-desc', 'Wait for content to load!'),
    }),
    // Methods to interact with the elements
    checkDefaultActivityIndicatorIsDisplayed: async function (
      this: ActivityIndicatorComponentScreenType,
    ): Promise<boolean> {
      return await Utils.checkElementExistence(this.defaultActivityIndicatorScreenElement);
    },
};