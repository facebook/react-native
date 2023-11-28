/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

type PlatformsReference = {
  ios: string,
  android: string,
};

class Utils {
  async checkElementExistence(locator: string): Promise<boolean> {
    await $(locator).waitForDisplayed();
    return $(locator).isDisplayed();
  }

  async clickElement(locator: string): Promise<void> {
    await $(locator).waitForDisplayed();
    await $(locator).click();
  }

  async getElementText(locator: string): Promise<string> {
    await $(locator).waitForDisplayed();
    return $(locator).getText();
  }

  async setElementText(locator: string, text: string): Promise<void> {
    await $(locator).waitForDisplayed();
    return $(locator).setValue(text);
  }

  platformSelect(platforms: PlatformsReference): string {
    return platforms[browser.capabilities.platformName.toLowerCase()];
  }

  async scrollToElement(locator: string): Promise<void> {
    let {width, height} = await driver.getWindowSize();
    let elementIsFound;
    try {
      elementIsFound = await $(locator).isClickable();
      while (!(await elementIsFound)) {
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
        elementIsFound = await $(locator).isClickable();
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
