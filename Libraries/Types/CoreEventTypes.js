/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
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
