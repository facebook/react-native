/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

describe('FantomModuleInit', () => {
  it('should not load the Fantom module eagerly', () => {
    expect(global.__FANTOM_PACKAGE_LOADED__).toBeUndefined();
  });

  it('should load the Fantom module lazily', () => {
    require('@react-native/fantom');

    expect(global.__FANTOM_PACKAGE_LOADED__).toBe(true);
  });
});
