/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

declare module 'wait-for-expect' {
  declare export default ((
    expectation: () => void | Promise<void>,
    timeout?: number,
    interval?: number,
  ) => Promise<void>) & {
    defaults: {
      timeout: number,
      interval: number,
    },
  };
}
