/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict
 */

// [macOS]

import NativePlatformConstantsMacOS from './NativePlatformConstantsMacOS';

export type PlatformSelectSpec<T> = {
  default?: T,
  native?: T,
  macos?: T,
  ...
};

const Platform = {
  __constants: null,
  OS: 'macos',
  // $FlowFixMe[unsafe-getters-setters]
  get Version(): string {
    // $FlowFixMe[object-this-reference]
    return this.constants.osVersion;
  },
  // $FlowFixMe[unsafe-getters-setters]
  get constants(): {|
    isTesting: boolean,
    osVersion: string,
    reactNativeVersion: {|
      major: number,
      minor: number,
      patch: number,
      prerelease: ?number,
    |},
    systemName: string,
  |} {
    // $FlowFixMe[object-this-reference]
    if (this.__constants == null) {
      // $FlowFixMe[object-this-reference]
      this.__constants = NativePlatformConstantsMacOS.getConstants();
    }
    // $FlowFixMe[object-this-reference]
    return this.__constants;
  },
  // $FlowFixMe[unsafe-getters-setters]
  get isTV(): boolean {
    return false;
  },
  // $FlowFixMe[unsafe-getters-setters]
  get isTesting(): boolean {
    if (__DEV__) {
      // $FlowFixMe[object-this-reference]
      return this.constants.isTesting;
    }
    return false;
  },
  select: <T>(spec: PlatformSelectSpec<T>): T =>
    // $FlowFixMe[incompatible-return]
    'macos' in spec
      ? // $FlowFixMe[incompatible-return]
        spec.macos
      : 'native' in spec
      ? // $FlowFixMe[incompatible-return]
        spec.native
      : // $FlowFixMe[incompatible-return]
        spec.default,
};

module.exports = Platform;
