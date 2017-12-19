/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule CoreEventTypes
 * @flow
 * @format
 */

'use strict';

export type Layout = {|
  +x: number,
  +y: number,
  +width: number,
  +height: number,
|};
export type LayoutEvent = {|
  +nativeEvent: {|
    +layout: Layout,
  |},
  +persist: () => void,
|};

export type PressEvent = Object;
