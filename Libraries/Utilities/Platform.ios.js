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

import NativePlatformConstants from './NativePlatformConstants';

export type PlatformSelectSpec<D, I> = {
  default?: D,
  ios?: I,
};

const Platform = {
  OS: 'ios',
  get Version() {
    return NativePlatformConstants.getConstants().osVersion || 0;
  },
  get isPad() {
    return NativePlatformConstants.getConstants().interfaceIdiom === 'pad';
  },
  /**
   * Deprecated, use `isTV` instead.
   */
  get isTVOS() {
    return Platform.isTV;
  },
  get isTV() {
    return NativePlatformConstants.getContants().interfaceIdiom === 'tv';
  },
  get isTesting(): boolean {
    if (__DEV__) {
      return NativePlatformConstants.getContants().isTesting;
    }
    return false;
  },
  select: <D, I>(spec: PlatformSelectSpec<D, I>): D | I =>
    'ios' in spec ? spec.ios : spec.default,
};

module.exports = Platform;
