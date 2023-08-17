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

type PlatformsReference = {
  ios: string,
  android: string,
};

class Utils {
  async checkElementExistence(locator: string): Promise<boolean> {
    await driver.$(locator).waitForDisplayed();
    return driver.$(locator).isDisplayed();
  }

  async clickElement(locator: string): Promise<void> {
    await driver.$(locator).waitForDisplayed();
    await driver.$(locator).click();
  }

  async getElementText(locator: string): Promise<string> {
    await driver.$(locator).waitForDisplayed();
    return driver.$(locator).getText();
  }

  platformSelect(platforms: PlatformsReference): string {
    // if something goes wrong, we fallback to ios. But it should never happent, the process will fail way earlier.
    return platforms[process?.env?.E2E_DEVICE || 'ios'];
  }
  async scrollToElement(locator: string): Promise<string> {
    const {width, height} = await driver.getWindowSize();
    const startPercentage = 70;
    const endPercentage = 50;
    const anchorPercentage = 50;

    const anchor = (width / 2) * anchorPercentage / 100;
    const startPoint = height * startPercentage / 100;
    const endPoint = (height / 2) * endPercentage / 100;
    do {
      driver.touchPerform([
        {
          action: 'press',
          options: {
            x: anchor,
            y: startPoint,
          },
        },
        {
          action: 'wait',
          options: {
            ms: 1000,
          },
        },
        {
          action: 'moveTo',
          options: {
            x: anchor,
            y: endPoint,
          },
        },
        {
          action: 'release',
          options: {},
        },
      ]);
    }
    while (driver.$(locator) == 0);
  }
}

export const iOSLabel = (label: string): string => {
  return `[label="${label}"]`;
};

export const iOSName = (name: string): string => {
  return `[name="${name}"]`;
};


export const androidWidget = (
  type: string,
  selector: string,
  id: string,
): string => {
  return `//android.widget.${type}[@${selector}="${id}"]`;
};

export const UtilsSingleton: Utils = new Utils();
