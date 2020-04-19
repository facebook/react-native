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
const {
  openComponentWithLabel,
  openExampleWithTitle,
} = require('../e2e-helpers');

describe('TextInput', () => {
  beforeAll(async () => {
    await device.reloadReactNative();
    await openComponentWithLabel(
      '<TextInput>',
      'Single and multi-line text inputs.',
    );
  });

  it('Live rewrite with spaces should replace spaces and enforce max length', async () => {
    await openExampleWithTitle('Live Re-Write \\(<sp>');

    await element(by.id('rewrite_sp_underscore_input')).typeText(
      'this is a long sentence',
    );
    await expect(element(by.id('rewrite_sp_underscore_input'))).toHaveText(
      'this_is_a_long_sente',
    );
  });

  it('Live rewrite with no spaces should remove spaces', async () => {
    await openExampleWithTitle('Live Re-Write \\(no spaces');

    await element(by.id('rewrite_no_sp_input')).typeText(
      'this is a long sentence',
    );
    await expect(element(by.id('rewrite_no_sp_input'))).toHaveText(
      'thisisalongsentence',
    );
  });

  it('Live rewrite with clear should remove spaces and clear', async () => {
    await openExampleWithTitle('and clear');

    await element(by.id('rewrite_clear_input')).typeText(
      'this is a long sentence',
    );
    await expect(element(by.id('rewrite_clear_input'))).toHaveText(
      'thisisalongsentence',
    );

    await element(by.id('rewrite_clear_button')).tap();

    await expect(element(by.id('rewrite_clear_input'))).toHaveText('');
  });
});
