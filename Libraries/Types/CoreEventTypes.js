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

/**
 * https://developer.mozilla.org/en-US/docs/Web/API/UIEvent
 */
export interface NativeUIEvent {
  /**
   * Returns a long with details about the event, depending on the event type.
   */
  +detail: number;
}

/**
 * https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent
 */
export interface NativeMouseEvent extends NativeUIEvent {
  /**
   * The X coordinate of the mouse pointer in global (screen) coordinates.
   */
  +screenX: number;
  /**
   * The Y coordinate of the mouse pointer in global (screen) coordinates.
   */
  +screenY: number;
  /**
   * The X coordinate of the mouse pointer relative to the whole document.
   */
  +pageX: number;
  /**
   * The Y coordinate of the mouse pointer relative to the whole document.
   */
  +pageY: number;
  /**
   * The X coordinate of the mouse pointer in local (DOM content) coordinates.
   */
  +clientX: number;
  /**
   * The Y coordinate of the mouse pointer in local (DOM content) coordinates.
   */
  +clientY: number;
  /**
   * Alias for NativeMouseEvent.clientX
   */
  +x: number;
  /**
   * Alias for NativeMouseEvent.clientY
   */
  +y: number;
  /**
   * Returns true if the control key was down when the mouse event was fired.
   */
  +ctrlKey: boolean;
  /**
   * Returns true if the shift key was down when the mouse event was fired.
   */
  +shiftKey: boolean;
  /**
   * Returns true if the alt key was down when the mouse event was fired.
   */
  +altKey: boolean;
  /**
   * Returns true if the meta key was down when the mouse event was fired.
   */
  +metaKey: boolean;
  /**
   * The button number that was pressed (if applicable) when the mouse event was fired.
   */
  +button: number;
  /**
   * The buttons being depressed (if any) when the mouse event was fired.
   */
  +buttons: number;
  /**
   * The secondary target for the event, if there is one.
   */
  +relatedTarget: null | number | React.ElementRef<HostComponent<mixed>>;
  // offset is proposed: https://drafts.csswg.org/cssom-view/#extensions-to-the-mouseevent-interface
  /**
   * The X coordinate of the mouse pointer between that event and the padding edge of the target node
   */
  +offsetX: number;
  /**
   * The Y coordinate of the mouse pointer between that event and the padding edge of the target node
   */
  +offsetY: number;
}

/**
 * https://developer.mozilla.org/en-US/docs/Web/API/PointerEvent
 */
export interface NativePointerEvent extends NativeMouseEvent {
  /**
   * A unique identifier for the pointer causing the event.
   */
  +pointerId: number;
  /**
   * The width (magnitude on the X axis), in CSS pixels, of the contact geometry of the pointer
   */
  +width: number;
  /**
   * The height (magnitude on the Y axis), in CSS pixels, of the contact geometry of the pointer.
   */
  +height: number;
  /**
   * The normalized pressure of the pointer input in the range 0 to 1, where 0 and 1 represent
   * the minimum and maximum pressure the hardware is capable of detecting, respectively.
   */
  +pressure: number;
  /**
   * The normalized tangential pressure of the pointer input (also known as barrel pressure or
   * cylinder stress) in the range -1 to 1, where 0 is the neutral position of the control.
   */
  +tangentialPressure: number;
  /**
   * The plane angle (in degrees, in the range of -90 to 90) between the Y–Z plane and the plane
   * containing both the pointer (e.g. pen stylus) axis and the Y axis.
   */
  +tiltX: number;
  /**
   * The plane angle (in degrees, in the range of -90 to 90) between the X–Z plane and the plane
   * containing both the pointer (e.g. pen stylus) axis and the X axis.
   */
  +tiltY: number;
  /**
   * The clockwise rotation of the pointer (e.g. pen stylus) around its major axis in degrees,
   * with a value in the range 0 to 359.
   */
  +twist: number;
  /**
   * Indicates the device type that caused the event (mouse, pen, touch, etc.)
   */
  +pointerType: string;
  /**
   * Indicates if the pointer represents the primary pointer of this pointer type.
   */
  +isPrimary: boolean;
}

export type PointerEvent = SyntheticEvent<NativePointerEvent>;

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
