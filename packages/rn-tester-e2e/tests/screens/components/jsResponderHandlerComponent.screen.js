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


type JSResponderHandlerComponentScreenType = {
    jsResponderHandlerScreenElement: string,
    rowZeroScreenElement: string,
    checkRowZeroLabelIsDisplayed: () => Promise<boolean>,
    getRowZeroText: () => Promise<string>,
};

export const JSResponderHandlerComponentScreen: JSResponderHandlerComponentScreenType = {
    // reference in the Components list
    jsResponderHandlerScreenElement: Utils.platformSelect({
      ios: iOSLabel('JSResponderHandler'),
      android: androidWidget('ViewGroup', 'resource-id', 'JSResponderHandler'),
    }),
    // References to elements within the Activity Indicator Component screen
    rowZeroScreenElement: Utils.platformSelect({
      ios: iOSName('row_js_responder_handler'),
      android: androidWidget('TextView', 'resource-id', 'row_js_responder_handler'),
    }),
    // Methods to interact with the elements
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