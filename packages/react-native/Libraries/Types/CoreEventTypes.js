/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

import type {HostInstance} from '../../src/private/types/HostInstance';

export type NativeSyntheticEvent<+T> = $ReadOnly<{
  bubbles: ?boolean,
  cancelable: ?boolean,
  currentTarget: number | HostInstance,
  defaultPrevented: ?boolean,
  dispatchConfig: $ReadOnly<{
    registrationName: string,
  }>,
  eventPhase: ?number,
  preventDefault: () => void,
  isDefaultPrevented: () => boolean,
  stopPropagation: () => void,
  isPropagationStopped: () => boolean,
  isTrusted: ?boolean,
  nativeEvent: T,
  persist: () => void,
  target: ?number | HostInstance,
  timeStamp: number,
  type: ?string,
}>;

export type ResponderSyntheticEvent<T> = $ReadOnly<{
  ...NativeSyntheticEvent<T>,
  touchHistory: $ReadOnly<{
    indexOfSingleActiveTouch: number,
    mostRecentTimeStamp: number,
    numberActiveTouches: number,
    touchBank: $ReadOnlyArray<
      $ReadOnly<{
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
      }>,
    >,
  }>,
}>;

export type LayoutRectangle = $ReadOnly<{
  x: number,
  y: number,
  width: number,
  height: number,
}>;

export type TextLayoutLine = $ReadOnly<{
  ...LayoutRectangle,
  ascender: number,
  capHeight: number,
  descender: number,
  text: string,
  xHeight: number,
}>;

export type LayoutChangeEvent = NativeSyntheticEvent<
  $ReadOnly<{
    layout: LayoutRectangle,
  }>,
>;

type TextLayoutEventData = $ReadOnly<{
  lines: Array<TextLayoutLine>,
}>;

export type TextLayoutEvent = NativeSyntheticEvent<TextLayoutEventData>;

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
  +relatedTarget: null | number | HostInstance;
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

export type PointerEvent = NativeSyntheticEvent<NativePointerEvent>;

export type NativeTouchEvent = $ReadOnly<{
  /**
   * Array of all touch events that have changed since the last event
   */
  changedTouches: $ReadOnlyArray<NativeTouchEvent>,
  /**
   * 3D Touch reported force
   * @platform ios
   */
  force?: number,
  /**
   * The ID of the touch
   */
  identifier: number,
  /**
   * The X position of the touch, relative to the element
   */
  locationX: number,
  /**
   * The Y position of the touch, relative to the element
   */
  locationY: number,
  /**
   * The X position of the touch, relative to the screen
   */
  pageX: number,
  /**
   * The Y position of the touch, relative to the screen
   */
  pageY: number,
  /**
   * The node id of the element receiving the touch event
   */
  target: ?number,
  /**
   * A time identifier for the touch, useful for velocity calculation
   */
  timestamp: number,
  /**
   * Array of all current touches on the screen
   */
  touches: $ReadOnlyArray<NativeTouchEvent>,
}>;

export type GestureResponderEvent = ResponderSyntheticEvent<NativeTouchEvent>;

export type NativeScrollRectangle = $ReadOnly<{
  bottom: number,
  left: number,
  right: number,
  top: number,
}>;

export type NativeScrollPoint = $ReadOnly<{
  y: number,
  x: number,
}>;

export type NativeScrollVelocity = $ReadOnly<{
  y: number,
  x: number,
}>;

export type NativeScrollSize = $ReadOnly<{
  height: number,
  width: number,
}>;

export type NativeScrollEvent = $ReadOnly<{
  contentInset: NativeScrollRectangle,
  contentOffset: NativeScrollPoint,
  contentSize: NativeScrollSize,
  layoutMeasurement: NativeScrollSize,
  velocity?: NativeScrollVelocity,
  zoomScale?: number,
  responderIgnoreScroll?: boolean,
  /**
   * @platform ios
   */
  targetContentOffset?: NativeScrollPoint,
}>;

export type ScrollEvent = NativeSyntheticEvent<NativeScrollEvent>;

export type TargetedEvent = $ReadOnly<{
  target: number,
  ...
}>;

export type BlurEvent = NativeSyntheticEvent<TargetedEvent>;

export type FocusEvent = NativeSyntheticEvent<TargetedEvent>;

export type MouseEvent = NativeSyntheticEvent<
  $ReadOnly<{
    clientX: number,
    clientY: number,
    pageX: number,
    pageY: number,
    timestamp: number,
  }>,
>;
