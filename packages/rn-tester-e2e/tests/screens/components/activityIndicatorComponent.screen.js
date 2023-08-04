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
    checkDefaultActivityIndicatorIsDisplayed: () => Promise<string>,
  };

export const ActivityIndicatorComponentScreen: ActivityIndicatorComponentScreenType = {
    // reference in the Components list
    activityIndicatorScreenElement: Utils.platformSelect({
      ios: iOSLabel('ActivityIndicator'),
      android: androidWidget('ViewGroup', 'text', 'ActivityIndicator'),
    }),
    // References to elements within the Activity Indicator Component screen
    defaultActivityIndicatorScreenElement: Utils.platformSelect({
      ios: iOSLabel('default_activity_indicator'),
      android: androidWidget('ProgressBar', 'resource-id', 'default_activity_indicator'),
    }),
    // Methods to interact with the elements
    checkDefaultActivityIndicatorIsDisplayed: async function (
      this: ActivityIndicatorComponentScreenType,
    ): Promise<string> {
      return await Utils.getElementText(this.defaultActivityIndicatorScreenElement);
    },
};