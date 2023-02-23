/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

import {UtilsSingleton as Utils, iOSLabel} from '../helpers/utils';

// root level screen in RNTester: Components

const buttonComponentLabel = 'Button Simple React Native button component.';

type ComponentsScreenType = {
  buttonComponentLabelElement: string,
  checkButtonComponentIsDisplayed: () => Promise<boolean>,
  clickButtonComponent: () => Promise<void>,
};

export const ComponentsScreen: ComponentsScreenType = {
  // Reference in the top level Component list
  buttonComponentLabelElement: Utils.platformSelect({
    ios: iOSLabel(buttonComponentLabel),
    android: `~${buttonComponentLabel}`,
  }),
  // Methods to interact with top level elements in the list
  checkButtonComponentIsDisplayed: async function (
    this: ComponentsScreenType,
  ): Promise<boolean> {
    return await Utils.checkElementExistence(this.buttonComponentLabelElement);
  },
  clickButtonComponent: async function (
    this: ComponentsScreenType,
  ): Promise<void> {
    await Utils.clickElement(this.buttonComponentLabelElement);
  },
};
