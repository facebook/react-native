/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* global device, element, by, expect */

describe('Sanity', () => {
  beforeEach(async () => {
    await device.reloadReactNative();
    await element(by.label(`<Button> Simple React Native button component.`)).tap();
  });

  afterEach(async () => {
    //TODO - remove app state persistency, till then, we must go back to main screen,
    await element(by.label('Back')).tap();
  });

  it('Simple button should be tappable', async () => {
    await element(by.label('Press Me')).tap();
    await expect(element(by.text('Simple has been pressed!'))).toBeVisible();
    await element(by.text('OK')).tap();
  });

  it('Adjusted color button should be tappable', async () => {
    await element(by.label('Press Purple')).tap();
    await expect(element(by.text('Purple has been pressed!'))).toBeVisible();
    await element(by.text('OK')).tap();
  });

  it(`Two buttons with JustifyContent:'space-between' should be tappable`, async () => {
    await element(by.label('This looks great!')).tap();
    await expect(element(by.text('Left has been pressed!'))).toBeVisible();
    await element(by.text('OK')).tap();

    await element(by.label('Ok!')).tap();
    await expect(element(by.text('Right has been pressed!'))).toBeVisible();
    await element(by.text('OK')).tap();
  });

  it('Disabled button should not interact', async () => {
    await element(by.label('I Am Disabled')).tap();
    await expect(element(by.text('Disabled has been pressed!'))).toBeNotVisible();
  });
});
