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

export type PlatformSelectSpec<A, D> = {
  android?: A,
  default?: D,
};

const Platform = {
  __constants: null,
  OS: 'android',
  get Version() {
    return this.constants.Version;
  },
  get constants() {
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
  select: <A, D>(spec: PlatformSelectSpec<A, D>): A | D =>
    'android' in spec ? spec.android : spec.default,
};

module.exports = Platform;
