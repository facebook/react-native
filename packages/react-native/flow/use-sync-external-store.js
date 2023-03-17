/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 * @nolint
 */

'use strict';

declare module 'use-sync-external-store/shim' {
  declare export function useSyncExternalStore<Value>(
    subscribe: (callback: Function) => () => void,
    getCurrentValue: () => Value,
    getServerSnapshot?: () => Value,
  ): Value;
}
