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
export type LayoutEvent = SyntheticEvent<{|
  +layout: Layout,
|}>;

export type SyntheticEvent<T> = {|
  +bubbles: ?boolean,
  +cancelable: ?boolean,
  +currentTarget: number,
  +defaultPrevented: ?boolean,
  +dispatchConfig: {|
    +registrationName: string,
  |},
  +eventPhase: ?number,
  +isDefaultPrevented: () => boolean,
  +isPropagationStopped: () => boolean,
  +isTrusted: ?boolean,
  +nativeEvent: T,
  +persist: () => void,
  +target: ?number,
  +timeStamp: number,
  +type: ?string,
|};

export type PressEvent = SyntheticEvent<Object>;

export type ScrollEvent = SyntheticEvent<{|
  +contentInset: {|
    +bottom: number,
    +left: number,
    +right: number,
    +top: number,
  |},
  +contentOffset: {|
    +y: number,
    +x: number,
  |},
  +contentSize: {|
    +height: number,
    +width: number,
  |},
  +layoutMeasurement: {|
    +height: number,
    +width: number,
  |},
  +zoomScale: number,
|}>;
