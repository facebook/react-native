/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+react_native
 * @format
 */

/* global device, element, by, expect */

const jestExpect = require('expect');
const {
  openComponentWithLabel,
  openExampleWithTitle,
} = require('../e2e-helpers');

describe('Switch', () => {
  beforeAll(async () => {
    await device.reloadReactNative();
    await openComponentWithLabel('<Switch>', '<Switch> Native boolean input');
  });

  describe('Switches can be set to true or false', () => {
    beforeAll(async () => {
      await openExampleWithTitle('Switches can be set to true or false');
    });

    it('Switch that starts off should switch', async () => {
      const testID = 'on-off-initial-off';
      const indicatorID = 'on-off-initial-off-indicator';

      await expect(element(by.id(testID))).toHaveValue('0');
      await expect(element(by.id(indicatorID))).toHaveText('Off');
      await element(by.id(testID)).tap();
      await expect(element(by.id(testID))).toHaveValue('1');
      await expect(element(by.id(indicatorID))).toHaveText('On');
    });

    it('Switch that starts on should switch', async () => {
      const testID = 'on-off-initial-on';
      const indicatorID = 'on-off-initial-on-indicator';

      await expect(element(by.id(testID))).toHaveValue('1');
      await expect(element(by.id(indicatorID))).toHaveText('On');
      await element(by.id(testID)).tap();
      await expect(element(by.id(testID))).toHaveValue('0');
      await expect(element(by.id(indicatorID))).toHaveText('Off');
    });
  });

  describe('Switches can be disabled', () => {
    beforeAll(async () => {
      await openExampleWithTitle('Switches can be disabled');
    });

    it('disabled switch should not toggle', async () => {
      const onTestID = 'disabled-initial-on';
      const offTestID = 'disabled-initial-off';
      const onIndicatorID = 'disabled-initial-on-indicator';
      const offIndicatorID = 'disabled-initial-off-indicator';

      await expect(element(by.id(onTestID))).toHaveValue('1');
      await expect(element(by.id(onIndicatorID))).toHaveText('On');

      try {
        await element(by.id(onTestID)).tap();
        throw new Error('Does not match');
      } catch (err) {
        jestExpect(err.message.message).toEqual(
          jestExpect.stringContaining(
            'Cannot perform action due to constraint(s) failure',
          ),
        );
      }
      await expect(element(by.id(onTestID))).toHaveValue('1');
      await expect(element(by.id(onIndicatorID))).toHaveText('On');

      await expect(element(by.id(offTestID))).toHaveValue('0');
      await expect(element(by.id(offIndicatorID))).toHaveText('Off');
      try {
        await element(by.id(offTestID)).tap();
        throw new Error('Does not match');
      } catch (err) {
        jestExpect(err.message.message).toEqual(
          jestExpect.stringContaining(
            'Cannot perform action due to constraint(s) failure',
          ),
        );
      }
      await expect(element(by.id(offTestID))).toHaveValue('0');
      await expect(element(by.id(offIndicatorID))).toHaveText('Off');
    });
  });
});
