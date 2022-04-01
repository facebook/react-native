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

declare module 'use-subscription' {
  declare export function useSubscription<Value>(subscription: {|
    getCurrentValue: () => Value,
    subscribe: (callback: Function) => () => void,
  |}): Value;
}
