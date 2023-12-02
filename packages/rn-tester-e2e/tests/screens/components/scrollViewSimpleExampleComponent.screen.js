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

type ScrollViewSimpleExampleComponentScreenType = {
  scrollViewSimpleExampleScreenElement: string,
  scrollViewItemScreenElement: string,
  checkScrollViewItemsDisplayed: () => Promise<boolean>,
  scrollUntilScrollViewSimpleExampleComponentIsDisplayed: () => Promise<void>,
};

export const ScrollViewSimpleExampleComponentScreen: ScrollViewSimpleExampleComponentScreenType =
  {
    // reference in the Components list
    scrollViewSimpleExampleScreenElement: Utils.platformSelect({
      ios: iOSName('ScrollViewSimpleExample'),
      android: androidWidget('TextView', 'text', 'ScrollViewSimpleExample'),
    }),
    // References to elements within the ScrollViewSimpleExample Component screen
    scrollViewItemScreenElement: Utils.platformSelect({
      ios: iOSName('scroll_view_item'),
      android: androidWidget('TextView', 'resource-id', 'scroll_view_item'),
    }),
    // Methods to interact with the elements
    checkScrollViewItemsDisplayed: async function (
      this: ScrollViewSimpleExampleComponentScreenType,
    ): Promise<boolean> {
      return await Utils.checkElementExistence(
        this.scrollViewItemScreenElement,
      );
    },
    scrollUntilScrollViewSimpleExampleComponentIsDisplayed: async function (
      this: ScrollViewSimpleExampleComponentScreenType,
    ): Promise<void> {
      return await Utils.scrollToElement(
        this.scrollViewSimpleExampleScreenElement,
      );
    },
  };
