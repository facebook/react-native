/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 * @fantom_hermes_variant static_hermes
 */

declare var HermesInternal: $HermesInternalType;

describe('"@fantom_hermes_variant static_hermes" in docblock', () => {
  it('should use Static Hermes', () => {
    expect(HermesInternal.getRuntimeProperties?.()['Static Hermes']).toBe(true);
  });
});
