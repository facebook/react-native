/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

import * as React from 'react';
import type {HostComponent} from '../Renderer/shims/ReactNativeTypes';

export type SyntheticEvent<+T> = $ReadOnly<{|
  bubbles: ?boolean,
  cancelable: ?boolean,
  currentTarget: number | React.ElementRef<HostComponent<mixed>>,
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
  target: ?number | React.ElementRef<HostComponent<mixed>>,
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

export type PointerEvent = ResponderSyntheticEvent<
  $ReadOnly<{|
    pointerId: number,
    pressure: number,
    pointerType: string,
    clientX: number,
    clientY: number,
    target: ?number,
    timestamp: number,
  |}>,
>;

export type PressEvent = ResponderSyntheticEvent<
  $ReadOnly<{|
    changedTouches: $ReadOnlyArray<$PropertyType<PressEvent, 'nativeEvent'>>,
    force?: number,
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

export type BlurEvent = SyntheticEvent<
  $ReadOnly<{|
    target: number,
  |}>,
>;

export type FocusEvent = SyntheticEvent<
  $ReadOnly<{|
    target: number,
  |}>,
>;

export type MouseEvent = SyntheticEvent<
  $ReadOnly<{|
    clientX: number,
    clientY: number,
    pageX: number,
    pageY: number,
    timestamp: number,
  |}>,
>;
