/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 * @oncall react_native
 * @fantom_mode opt
 */

describe('"@fantom_mode opt" in docblock', () => {
  it('should use optimized builds', () => {
    expect(__DEV__).toBe(false);
  });
});
