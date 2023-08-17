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


type ImageComponentScreenType = {
    imageScreenElement: string,
    plainNetworkImageScreenElement: string,
    checkPlainNetworkImageIsDisplayed: () => Promise<boolean>,
};

export const ImageComponentScreen: ImageComponentScreenType = {
    // reference in the Components list
    imageScreenElement: Utils.platformSelect({
      ios: iOSLabel('Image'),
      android: androidWidget('ViewGroup', 'resource-id', 'Image'),
    }),
    // References to elements within the Activity Indicator Component screen
    plainNetworkImageScreenElement: Utils.platformSelect({
      ios: iOSName('plain_network_image'),
      android: androidWidget('ImageView', 'resource-id', 'plain_network_image'),
    }),
    // Methods to interact with the elements
    checkPlainNetworkImageIsDisplayed: async function (
      this: ImageComponentScreenType,
    ): Promise<boolean> {
      return await Utils.checkElementExistence(this.plainNetworkImageScreenElement);
    },
};