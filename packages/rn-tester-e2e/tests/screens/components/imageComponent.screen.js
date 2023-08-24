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

type ImageComponentScreenType = {
  imageScreenElement: string,
  normalThumbImageScreenElement: string,
  scrollUntilImageComponentIsDisplayed: () => Promise<void>,
  scrollUntilNormalThumbImageComponentIsDisplayed: () => Promise<void>,
  checkNormalThumbImageIsDisplayed: () => Promise<boolean>,
};

export const ImageComponentScreen: ImageComponentScreenType = {
  // reference in the Components list
  imageScreenElement: Utils.platformSelect({
    ios: iOSName('Image'),
    android: androidWidget('TextView', 'text', 'Image'),
  }),
  // References to elements within the Image Component screen
  normalThumbImageScreenElement: Utils.platformSelect({
    ios: iOSName('normal_thumb_image'),
    android: androidWidget('ImageView', 'resource-id', 'normal_thumb_image'),
  }),
  // Methods to interact with the elements
  scrollUntilImageComponentIsDisplayed: async function (
    this: ImageComponentScreenType,
  ): Promise<void> {
    return await Utils.scrollToElement(this.imageScreenElement);
  },
  scrollUntilNormalThumbImageComponentIsDisplayed: async function (
    this: ImageComponentScreenType,
  ): Promise<void> {
    return await Utils.scrollToElement(this.normalThumbImageScreenElement);
  },
  checkNormalThumbImageIsDisplayed: async function (
    this: ImageComponentScreenType,
  ): Promise<boolean> {
    return await Utils.checkElementExistence(
      this.normalThumbImageScreenElement,
    );
  },
};
