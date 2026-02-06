/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 * @oncall react_native
 */

import '@react-native/fantom/src/setUpDefaultReactNativeEnvironment';

describe('setUpDefaultReactNativeEnvironment (globals)', () => {
  it('should be exposed as globalThis, global, window and self', () => {
    expect(globalThis).toBe(global);
    expect(globalThis).toBe(window);
    expect(globalThis).toBe(self);
  });

  it('should provide process.env.NODE_ENV', () => {
    expect(process.env.NODE_ENV).toBe('development');
  });

  it('should provide the __DEV__ constant', () => {
    expect(__DEV__).toBe(true);
  });
});
