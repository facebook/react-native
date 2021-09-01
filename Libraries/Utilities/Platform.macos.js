/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict
 */

// TODO(macOS GH#774) Copied from Platform.ios.js

'use strict';

import NativePlatformConstantsMacOS from './NativePlatformConstantsMacOS';

export type PlatformSelectSpec<D, N, I> = {
  default?: D,
  native?: N,
  macos?: I,
  ...
};

const Platform = {
  __constants: null,
  OS: 'macos',
  // $FlowFixMe[unsafe-getters-setters]
  get Version(): string {
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
    if (this.__constants == null) {
      this.__constants = NativePlatformConstantsMacOS.getConstants();
    }
    return this.__constants;
  },
  // $FlowFixMe[unsafe-getters-setters]
  get isTV(): boolean {
    return false;
  },
  // $FlowFixMe[unsafe-getters-setters]
  get isTesting(): boolean {
    if (__DEV__) {
      return this.constants.isTesting;
    }
    return false;
  },
  select: <D, N, I>(spec: PlatformSelectSpec<D, N, I>): D | N | I =>
    'macos' in spec
      ? spec.macos
      : 'native' in spec
      ? spec.native
      : spec.default,
};

module.exports = Platform;
