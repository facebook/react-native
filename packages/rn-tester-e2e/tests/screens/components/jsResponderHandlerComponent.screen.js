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

type JSResponderHandlerComponentScreenType = {
  jsResponderHandlerScreenElement: string,
  rowZeroScreenElement: string,
  scrollUntilJSResponderHandlerComponentIsDisplayed: () => Promise<void>,
  checkRowZeroLabelIsDisplayed: () => Promise<boolean>,
  getRowZeroText: () => Promise<string>,
};

export const JSResponderHandlerComponentScreen: JSResponderHandlerComponentScreenType =
  {
    // reference in the Components list
    jsResponderHandlerScreenElement: Utils.platformSelect({
      ios: iOSName('JSResponderHandler'),
      android: androidWidget('TextView', 'text', 'JSResponderHandler'),
    }),
    // References to elements within the js responder handler Component screen
    rowZeroScreenElement: Utils.platformSelect({
      ios: iOSName('row_js_responder_handler'),
      android: androidWidget(
        'TextView',
        'resource-id',
        'row_js_responder_handler',
      ),
    }),
    // Methods to interact with the elements
    scrollUntilJSResponderHandlerComponentIsDisplayed: async function (
      this: JSResponderHandlerComponentScreenType,
    ): Promise<void> {
      return await Utils.scrollToElement(this.jsResponderHandlerScreenElement);
    },
    checkRowZeroLabelIsDisplayed: async function (
      this: JSResponderHandlerComponentScreenType,
    ): Promise<boolean> {
      return await Utils.checkElementExistence(this.rowZeroScreenElement);
    },
    getRowZeroText: async function (
      this: JSResponderHandlerComponentScreenType,
    ): Promise<string> {
      return await Utils.getElementText(this.rowZeroScreenElement);
    },
  };
