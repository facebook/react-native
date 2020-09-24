/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

/* global device, element, by, expect, waitFor */
const {openExampleWithTitle} = require('../e2e-helpers');

describe('Alert', () => {
  beforeAll(async () => {
    await element(by.id('apis-tab')).tap();
    await element(by.id('explorer_search')).replaceText('Alert');
    await element(by.label('Alerts')).tap();
  });

  afterAll(async () => {
    await element(by.label('Back')).tap();
  });

  it('AlertWithDefaultButton: should show alert dialog with message and default button', async () => {
    const alertMessage = 'An external USB drive has been detected!';

    await openExampleWithTitle('Alert with default Button');
    await element(by.id('alert-with-default-button')).tap();
    await expect(element(by.text(alertMessage))).toBeVisible();
    await element(by.text('OK')).tap();
  });

  it('AlertWithThreeButtons: should show alert dialog with three buttons', async () => {
    const alertMessage = 'Do you want to save your changes?';

    await openExampleWithTitle('Alert with three Buttons');
    await element(by.id('alert-with-three-buttons')).tap();
    await expect(element(by.text(alertMessage))).toBeVisible();
    await expect(element(by.text('Cancel'))).toBeVisible();
    await expect(element(by.text('No'))).toBeVisible();
    await expect(element(by.text('Yes'))).toBeVisible();
    await element(by.text('Yes')).tap();
  });

  it('AlertWithThreeButtons: should successfully call the callback on button press', async () => {
    await openExampleWithTitle('Alert with three Buttons');
    await element(by.id('alert-with-three-buttons')).tap();
    await element(by.text('Cancel')).tap();
    await expect(element(by.text('Log: Cancel Pressed!'))).toBeVisible();
  });
});
