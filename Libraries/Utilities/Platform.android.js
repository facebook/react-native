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
  OS: 'android',
  get Version() {
    return NativePlatformConstantsAndroid.getConstants().Version;
  },
  get constants() {
    return NativePlatformConstantsAndroid.getConstants();
  },
  get isTesting(): boolean {
    if (__DEV__) {
      return NativePlatformConstantsAndroid.getConstants().isTesting;
    }
    return false;
  },
  get isTV(): boolean {
    return NativePlatformConstantsAndroid.getConstants().uiMode === 'tv';
  },
  select: <A, D>(spec: PlatformSelectSpec<A, D>): A | D =>
    'android' in spec ? spec.android : spec.default,
};

module.exports = Platform;
