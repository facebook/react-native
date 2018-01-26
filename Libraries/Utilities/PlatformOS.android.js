/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule PlatformOS
 * @flow
 */

'use strict';

export type PlatformSelectSpec<A, I> = {|
  android: A,
  ios: I,
|};

const PlatformOS = {
  OS: 'android',
  select: <A, I> (spec: PlatformSelectSpec<A, I>): A | I => spec.android,
};

module.exports = PlatformOS;
