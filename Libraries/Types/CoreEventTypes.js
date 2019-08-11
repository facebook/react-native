/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
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
  preventDefault: () => void,
  isDefaultPrevented: () => boolean,
  stopPropagation: () => void,
  isPropagationStopped: () => boolean,
  isTrusted: ?boolean,
  nativeEvent: T,
  persist: () => void,
  target: ?number,
  timeStamp: number,
  type: ?string,
|}>;

export type ResponderSyntheticEvent<T> = $ReadOnly<{|
  ...SyntheticEvent<T>,
  touchHistory: $ReadOnly<{|
    indexOfSingleActiveTouch: number,
    mostRecentTimeStamp: number,
    numberActiveTouches: number,
    touchBank: $ReadOnlyArray<
      $ReadOnly<{|
        touchActive: boolean,
        startPageX: number,
        startPageY: number,
        startTimeStamp: number,
        currentPageX: number,
        currentPageY: number,
        currentTimeStamp: number,
        previousPageX: number,
        previousPageY: number,
        previousTimeStamp: number,
      |}>,
    >,
  |}>,
|}>;

export type Layout = $ReadOnly<{|
  x: number,
  y: number,
  width: number,
  height: number,
|}>;

export type TextLayout = $ReadOnly<{|
  ...Layout,
  ascender: number,
  capHeight: number,
  descender: number,
  text: string,
  xHeight: number,
|}>;

export type LayoutEvent = SyntheticEvent<
  $ReadOnly<{|
    layout: Layout,
  |}>,
>;

export type TextLayoutEvent = SyntheticEvent<
  $ReadOnly<{|
    lines: Array<TextLayout>,
  |}>,
>;

export type PressEvent = ResponderSyntheticEvent<
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
    targetContentOffset?: $ReadOnly<{|
      y: number,
      x: number,
    |}>,
    velocity?: $ReadOnly<{|
      y: number,
      x: number,
    |}>,
    zoomScale?: number,
    responderIgnoreScroll?: boolean,
  |}>,
>;
