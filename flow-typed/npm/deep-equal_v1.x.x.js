/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

declare module 'deep-equal' {
  declare module.exports: (
    actual: mixed,
    expected: mixed,
    options?: {strict: boolean},
  ) => boolean;
}
