/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

import NativePlatformConstantsAndroid from './NativePlatformConstantsAndroid';

export type PlatformSelectSpec<A, N, D> = {
  android?: A,
  native?: N,
  default?: D,
  ...
};

const Platform = {
  __constants: null,
  OS: 'android',
  get Version(): number {
    return this.constants.Version;
  },
  get constants(): {|
    isTesting: boolean,
    reactNativeVersion: {|
      major: number,
      minor: number,
      patch: number,
      prerelease: ?number,
    |},
    Version: number,
    Release: string,
    Serial: string,
    Fingerprint: string,
    Model: string,
    ServerHost?: string,
    uiMode: string,
  |} {
    if (this.__constants == null) {
      this.__constants = NativePlatformConstantsAndroid.getConstants();
    }
    return this.__constants;
  },
  get isTesting(): boolean {
    if (__DEV__) {
      return this.constants.isTesting;
    }
    return false;
  },
  get isTV(): boolean {
    return this.constants.uiMode === 'tv';
  },
  select: <A, N, D>(spec: PlatformSelectSpec<A, N, D>): A | N | D =>
    'android' in spec
      ? spec.android
      : 'native' in spec
      ? spec.native
      : spec.default,
};

module.exports = Platform;
