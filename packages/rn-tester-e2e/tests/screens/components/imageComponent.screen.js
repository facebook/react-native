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
  androidWidget,
  iOSName,
} from '../../helpers/utils';

const plainNetworkImageTitleText = 'Plain Network Image with `source` prop.';

type ImageComponentScreenType = {
  imageScreenElement: string,
  plainNetworkImageTitleScreenElement: string,
  scrollUntilImageComponentIsDisplayed: () => Promise<void>,
  checkPlainNetworkImageTitleIsDisplayed: () => Promise<boolean>,
};

export const ImageComponentScreen: ImageComponentScreenType = {
  // reference in the Components list
  imageScreenElement: Utils.platformSelect({
    ios: iOSName('Image'),
    android: androidWidget('TextView', 'text', 'Image'),
  }),
  // References to elements within the Image Component screen
  plainNetworkImageTitleScreenElement: Utils.platformSelect({
    ios: iOSName(plainNetworkImageTitleText),
    android: androidWidget('TextView', 'text', plainNetworkImageTitleText),
  }),
  // Methods to interact with the elements
  scrollUntilImageComponentIsDisplayed: async function (
    this: ImageComponentScreenType,
  ): Promise<void> {
    return await Utils.scrollToElement(this.imageScreenElement);
  },
  checkPlainNetworkImageTitleIsDisplayed: async function (
    this: ImageComponentScreenType,
  ): Promise<boolean> {
    return await Utils.checkElementExistence(
      this.plainNetworkImageTitleScreenElement,
    );
  },
};
