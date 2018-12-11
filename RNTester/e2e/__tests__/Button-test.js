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

describe('Button', () => {
  beforeAll(async () => {
    await device.reloadReactNative();
    await element(by.id('explorer_search')).replaceText('<Button>');
    await element(
      by.label('<Button> Simple React Native button component.'),
    ).tap();
  });

  afterAll(async () => {
    //TODO - remove app state persistency, till then, we must go back to main screen,
    await element(by.label('Back')).tap();
  });

  it('Simple button should be tappable', async () => {
    await element(by.id('simple_button')).tap();
    await expect(element(by.text('Simple has been pressed!'))).toBeVisible();
    await element(by.text('OK')).tap();
  });

  it('Adjusted color button should be tappable', async () => {
    await element(by.id('purple_button')).tap();
    await expect(element(by.text('Purple has been pressed!'))).toBeVisible();
    await element(by.text('OK')).tap();
  });

  it("Two buttons with JustifyContent:'space-between' should be tappable", async () => {
    await element(by.id('left_button')).tap();
    await expect(element(by.text('Left has been pressed!'))).toBeVisible();
    await element(by.text('OK')).tap();

    await element(by.id('right_button')).tap();
    await expect(element(by.text('Right has been pressed!'))).toBeVisible();
    await element(by.text('OK')).tap();
  });

  it('Disabled button should not interact', async () => {
    await element(by.id('disabled_button')).tap();
    await expect(
      element(by.text('Disabled has been pressed!')),
    ).toBeNotVisible();
  });
});
