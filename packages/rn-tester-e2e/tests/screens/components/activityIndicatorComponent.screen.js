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
  iOSLabel,
  androidWidget,
  iOSName,
} from '../../helpers/utils';

type ActivityIndicatorComponentScreenType = {
  activityIndicatorScreenElement: string,
  defaultActivityIndicatorScreenElement: string,
  checkDefaultActivityIndicatorIsDisplayed: () => Promise<boolean>,
};

const defaultActivityIndicatorTextDesc = 'Wait for content to load!';

export const ActivityIndicatorComponentScreen: ActivityIndicatorComponentScreenType =
  {
    // reference in the Components list
    activityIndicatorScreenElement: Utils.platformSelect({
      ios: iOSName('ActivityIndicator'),
      android: androidWidget('TextView', 'text', 'ActivityIndicator'),
    }),
    // References to elements within the Activity Indicator Component screen
    defaultActivityIndicatorScreenElement: Utils.platformSelect({
      ios: iOSLabel(defaultActivityIndicatorTextDesc),
      android: androidWidget(
        'FrameLayout',
        'content-desc',
        defaultActivityIndicatorTextDesc,
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
  };
