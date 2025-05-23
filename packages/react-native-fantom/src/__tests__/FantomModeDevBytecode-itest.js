/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @fantom_mode dev-bytecode
 * @flow strict-local
 * @format
 */

describe('"@fantom_mode dev-bytecode" in docblock', () => {
  it('should use development builds', () => {
    expect(__DEV__).toBe(true);
  });
});
