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


type ImageComponentScreenType = {
    imageScreenElement: string,
    plainNetworkImageScreenElement: string,
    checkPlainNetworkImageIsDisplayed: () => Promise<string>,
  };

export const ActivityIndicatorComponentScreen: ActivityIndicatorComponentScreenType = {
    // reference in the Components list
    imageScreenElement: Utils.platformSelect({
      ios: iOSLabel('Image'),
      android: androidWidget('ViewGroup', 'text', 'Image'),
    }),
    // References to elements within the Activity Indicator Component screen
    defaultActivityIndicatorScreenElement: Utils.platformSelect({
      ios: iOSLabel('plain_network_image'),
      android: androidWidget('ProgressBar', 'resource-id', 'plain_network_image'),
    }),
    // Methods to interact with the elements
    checkPlainNetworkImageIsDisplayed: async function (
      this: ImageComponentScreenType,
    ): Promise<string> {
      return await Utils.getElementText(this.plainNetworkImageScreenElement);
    },
};