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

export type SyntheticEvent<T> = $ReadOnly<{|
  bubbles: ?boolean,
  cancelable: ?boolean,
  currentTarget: number,
  defaultPrevented: ?boolean,
  dispatchConfig: $ReadOnly<{|
    registrationName: string,
  |}>,
  eventPhase: ?number,
  isDefaultPrevented: () => boolean,
  isPropagationStopped: () => boolean,
  isTrusted: ?boolean,
  nativeEvent: T,
  persist: () => void,
  target: ?number,
  timeStamp: number,
  type: ?string,
|}>;

export type Layout = $ReadOnly<{|
  x: number,
  y: number,
  width: number,
  height: number,
|}>;

export type LayoutEvent = SyntheticEvent<
  $ReadOnly<{|
    layout: Layout,
  |}>,
>;

export type PressEvent = SyntheticEvent<
  $ReadOnly<{|
    changedTouches: $ReadOnlyArray<$PropertyType<PressEvent, 'nativeEvent'>>,
    force: number,
    identifier: number,
    locationX: number,
    locationY: number,
    pageX: number,
    pageY: number,
    target: ?number,
    timestamp: number,
    touches: $ReadOnlyArray<$PropertyType<PressEvent, 'nativeEvent'>>,
  |}>,
>;

export type ScrollEvent = SyntheticEvent<
  $ReadOnly<{|
    contentInset: $ReadOnly<{|
      bottom: number,
      left: number,
      right: number,
      top: number,
    |}>,
    contentOffset: $ReadOnly<{|
      y: number,
      x: number,
    |}>,
    contentSize: $ReadOnly<{|
      height: number,
      width: number,
    |}>,
    layoutMeasurement: $ReadOnly<{|
      height: number,
      width: number,
    |}>,
    zoomScale: number,
  |}>,
>;
