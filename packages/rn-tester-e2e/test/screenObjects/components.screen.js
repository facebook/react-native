/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */
import Utils from '../helpers/utils';

class ComponentsScreen {
  buttonComponentElement = Utils.platformSelect({
    ios: '[label="Button Simple React Native button component."]',
    android: '~Button Simple React Native button component.',
  });

  async checkButtonComponentIsDisplayed() {
    return await Utils.checkElementExistence(this.buttonComponentElement);
  }

  async clickButtonComponent() {
    await Utils.clickElement(this.buttonComponentElement);
  }
}
module.exports = new ComponentsScreen();
