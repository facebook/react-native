/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+react_native
 * @format
 */

/* global element, by, expect, device */

const {
  openComponentWithLabel,
  openExampleWithTitle,
} = require('../e2e-helpers');

describe('DatePickerIOS', () => {
  beforeAll(async () => {
    await device.reloadReactNative();
    await openComponentWithLabel(
      '<DatePickerIOS>',
      '<DatePickerIOS> Select dates and times using the native UIDatePicker.',
    );
  });

  it('Should change indicator with datetime picker', async () => {
    await openExampleWithTitle('Date and time picker');
    const testID = 'date-and-time';
    const indicatorID = 'date-and-time-indicator';

    const testElement = await element(
      by.type('UIPickerView').withAncestor(by.id(testID)),
    );
    const indicator = await element(by.id(indicatorID));

    await expect(testElement).toBeVisible();
    await expect(indicator).toBeVisible();

    await testElement.setColumnToValue(0, 'Dec 4');
    await testElement.setColumnToValue(1, '4');
    await testElement.setColumnToValue(2, '10');
    await testElement.setColumnToValue(3, 'AM');

    await expect(indicator).toHaveText('12/4/2005 4:10 AM');
  });

  it('Should change indicator with date-only picker', async () => {
    await openExampleWithTitle('Date only');
    const testID = 'date-only';
    const indicatorID = 'date-and-time-indicator';

    const testElement = await element(
      by.type('UIPickerView').withAncestor(by.id(testID)),
    );
    const indicator = await element(by.id(indicatorID));

    await expect(testElement).toBeVisible();
    await expect(indicator).toBeVisible();

    await testElement.setColumnToValue(0, 'November');
    await testElement.setColumnToValue(1, '3');
    await testElement.setColumnToValue(2, '2006');

    await expect(indicator).toHaveText('11/3/2006 4:10 AM');
  });
});
