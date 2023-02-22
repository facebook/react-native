/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

import {driver} from '../../jest.setup';

class Utils {
  async checkElementExistence(locator) {
    await driver.$(locator).waitForDisplayed();
    return driver.$(locator).isDisplayed();
  }

  async clickElement(locator) {
    await driver.$(locator).waitForDisplayed();
    await driver.$(locator).click();
  }

  async getElementText(locator) {
    await driver.$(locator).waitForDisplayed();
    return driver.$(locator).getText();
  }

  platformSelect(platforms) {
    return platforms[process.env.E2E_DEVICE];
  }
}
module.exports = new Utils();
