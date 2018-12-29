/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+react_native
 * @format
 */

/* global element, by, expect */

describe('Picker', () => {
  beforeAll(async () => {
    await element(by.id('explorer_search')).replaceText('<Picker>');
    await element(
      by.label(
        '<Picker> Provides multiple options to choose from, using either a dropdown menu or a dialog.',
      ),
    ).tap();
  });

  afterAll(async () => {
    await element(by.label('Back')).tap();
  });

  it('should be selectable by ID', async () => {
    await element(by.id('explorer_example_search')).replaceText('Basic picker');
    await expect(element(by.id('basic-picker'))).toBeVisible();
  });
});
