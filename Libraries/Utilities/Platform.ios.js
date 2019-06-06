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

import NativePlatformConstantsIOS from './NativePlatformConstantsIOS';

export type PlatformSelectSpec<D, I> = {
  default?: D,
  ios?: I,
};

const Platform = {
  OS: 'ios',
  get Version() {
    return NativePlatformConstantsIOS.getConstants().osVersion;
  },
  get constants() {
    return NativePlatformConstantsIOS.getConstants();
  },
  get isPad() {
    return NativePlatformConstantsIOS.getConstants().interfaceIdiom === 'pad';
  },
  /**
   * Deprecated, use `isTV` instead.
   */
  get isTVOS() {
    return Platform.isTV;
  },
  get isTV() {
    return NativePlatformConstantsIOS.getConstants().interfaceIdiom === 'tv';
  },
  get isTesting(): boolean {
    if (__DEV__) {
      return NativePlatformConstantsIOS.getConstants().isTesting;
    }
    return false;
  },
  select: <D, I>(spec: PlatformSelectSpec<D, I>): D | I =>
    'ios' in spec ? spec.ios : spec.default,
};

module.exports = Platform;
