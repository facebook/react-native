/**
 * Copyright (c) 2013-present, Facebook, Inc.
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

declare module 'fbjs/lib/nullthrows' {
  declare module.exports: <T>(value: ?T) => T;
}
