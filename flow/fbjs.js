/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

declare module 'fbjs/lib/invariant' {
  declare function exports<T>(condition: any, message: string, ...args: Array<any>): void;
}

declare module 'fbjs/lib/nullthrows' {
  declare function exports<T>(value: ?T): T;
}
