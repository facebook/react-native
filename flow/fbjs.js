/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

declare module 'fbjs/lib/invariant' {
  declare module.exports: <T>(
    condition: any,
    message: string,
    ...args: Array<any>
  ) => void;
}
