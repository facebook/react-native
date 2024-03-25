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

  async scrollToElement(locator: string): Promise<void> {
    let {width, height} = await driver.getWindowSize();
    let elementIsFound;
    try {
      elementIsFound = await driver.$(locator).isDisplayed();
      while (!elementIsFound) {
        driver.touchPerform([
          {
            action: 'press',
            options: {
              x: width / 2,
              y: height / 2,
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
              x: width / 2,
              y: height / 10,
            },
          },
          {
            action: 'release',
          },
        ]);
        elementIsFound = await driver.$(locator).isDisplayed();
      }
    } catch (err) {
      console.log('Element is not found');
    }
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
