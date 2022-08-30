/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

'use strict';

import type {PressEvent} from '../Types/CoreEventTypes';

/**
 * `PanResponder` reconciles several touches into a single gesture. It makes
 * single-touch gestures resilient to extra touches, and can be used to
 * recognize simple multi-touch gestures.
 *
 * By default, `PanResponder` holds an `InteractionManager` handle to block
 * long-running JS events from interrupting active gestures.
 *
 * It provides a predictable wrapper of the responder handlers provided by the
 * [gesture responder system](docs/gesture-responder-system.html).
 * For each handler, it provides a new `gestureState` object alongside the
 * native event object:
 *
 * ```
 * onPanResponderMove: (event, gestureState) => {}
 * ```
 *
 * A native event is a synthetic touch event with the following form:
 *
 *  - `nativeEvent`
 *      + `changedTouches` - Array of all touch events that have changed since the last event
 *      + `identifier` - The ID of the touch
 *      + `locationX` - The X position of the touch, relative to the element
 *      + `locationY` - The Y position of the touch, relative to the element
 *      + `pageX` - The X position of the touch, relative to the root element
 *      + `pageY` - The Y position of the touch, relative to the root element
 *      + `target` - The node id of the element receiving the touch event
 *      + `timestamp` - A time identifier for the touch, useful for velocity calculation
 *      + `touches` - Array of all current touches on the screen
 *
 * A `gestureState` object has the following:
 *
 *  - `stateID` - ID of the gestureState- persisted as long as there at least
 *     one touch on screen
 *  - `moveX` - the latest screen coordinates of the recently-moved touch
 *  - `moveY` - the latest screen coordinates of the recently-moved touch
 *  - `x0` - the screen coordinates of the responder grant
 *  - `y0` - the screen coordinates of the responder grant
 *  - `dx` - accumulated distance of the gesture since the touch started
 *  - `dy` - accumulated distance of the gesture since the touch started
 *  - `vx` - current velocity of the gesture
 *  - `vy` - current velocity of the gesture
 *  - `numberActiveTouches` - Number of touches currently on screen
 *
 * ### Basic Usage
 *
 * ```
 *   componentWillMount: function() {
 *     this._panResponder = PanResponder.create({
 *       // Ask to be the responder:
 *       onStartShouldSetPanResponder: (evt, gestureState) => true,
 *       onStartShouldSetPanResponderCapture: (evt, gestureState) => true,
 *       onMoveShouldSetPanResponder: (evt, gestureState) => true,
 *       onMoveShouldSetPanResponderCapture: (evt, gestureState) => true,
 *
 *       onPanResponderGrant: (evt, gestureState) => {
 *         // The gesture has started. Show visual feedback so the user knows
 *         // what is happening!
 *
 *         // gestureState.d{x,y} will be set to zero now
 *       },
 *       onPanResponderMove: (evt, gestureState) => {
 *         // The most recent move distance is gestureState.move{X,Y}
 *
 *         // The accumulated gesture distance since becoming responder is
 *         // gestureState.d{x,y}
 *       },
 *       onPanResponderTerminationRequest: (evt, gestureState) => true,
 *       onPanResponderRelease: (evt, gestureState) => {
 *         // The user has released all touches while this view is the
 *         // responder. This typically means a gesture has succeeded
 *       },
 *       onPanResponderTerminate: (evt, gestureState) => {
 *         // Another component has become the responder, so this gesture
 *         // should be cancelled
 *       },
 *       onShouldBlockNativeResponder: (evt, gestureState) => {
 *         // Returns whether this component should block native components from becoming the JS
 *         // responder. Returns true by default. Is currently only supported on android.
 *         return true;
 *       },
 *     });
 *   },
 *
 *   render: function() {
 *     return (
 *       <View {...this._panResponder.panHandlers} />
 *     );
 *   },
 *
 * ```
 *
 * ### Working Example
 *
 * To see it in action, try the
 * [PanResponder example in RNTester](https://github.com/facebook/react-native/blob/HEAD/packages/rn-tester/js/examples/PanResponder/PanResponderExample.js)
 */

export type GestureState = {|
  /**
   * ID of the gestureState - persisted as long as there at least one touch on screen
   */
  stateID: number,

  /**
   * The latest screen coordinates of the recently-moved touch
   */
  moveX: number,

  /**
   * The latest screen coordinates of the recently-moved touch
   */
  moveY: number,

  /**
   * The screen coordinates of the responder grant
   */
  x0: number,

  /**
   * The screen coordinates of the responder grant
   */
  y0: number,

  /**
   * Accumulated distance of the gesture since the touch started
   */
  dx: number,

  /**
   * Accumulated distance of the gesture since the touch started
   */
  dy: number,

  /**
   * Current velocity of the gesture
   */
  vx: number,

  /**
   * Current velocity of the gesture
   */
  vy: number,

  /**
   * Number of touches currently on screen
   */
  numberActiveTouches: number,

  /**
   * All `gestureState` accounts for timeStamps up until this value
   *
   * @private
   */
  _accountsForMovesUpTo: number,
|};

type ActiveCallback = (
  event: PressEvent,
  gestureState: GestureState,
) => boolean;

type PassiveCallback = (event: PressEvent, gestureState: GestureState) => mixed;

type PanHandlers = {|
  onMoveShouldSetResponder: (event: PressEvent) => boolean,
  onMoveShouldSetResponderCapture: (event: PressEvent) => boolean,
  onResponderEnd: (event: PressEvent) => void,
  onResponderGrant: (event: PressEvent) => boolean,
  onResponderMove: (event: PressEvent) => void,
  onResponderReject: (event: PressEvent) => void,
  onResponderRelease: (event: PressEvent) => void,
  onResponderStart: (event: PressEvent) => void,
  onResponderTerminate: (event: PressEvent) => void,
  onResponderTerminationRequest: (event: PressEvent) => boolean,
  onStartShouldSetResponder: (event: PressEvent) => boolean,
  onStartShouldSetResponderCapture: (event: PressEvent) => boolean,
|};

type PanResponderConfig = $ReadOnly<{|
  onMoveShouldSetPanResponder?: ?ActiveCallback,
  onMoveShouldSetPanResponderCapture?: ?ActiveCallback,
  onStartShouldSetPanResponder?: ?ActiveCallback,
  onStartShouldSetPanResponderCapture?: ?ActiveCallback,
  /**
   * The body of `onResponderGrant` returns a bool, but the vast majority of
   * callsites return void and this TODO notice is found in it:
   *   TODO: t7467124 investigate if this can be removed
   */
  onPanResponderGrant?: ?(PassiveCallback | ActiveCallback),
  onPanResponderReject?: ?PassiveCallback,
  onPanResponderStart?: ?PassiveCallback,
  onPanResponderEnd?: ?PassiveCallback,
  onPanResponderRelease?: ?PassiveCallback,
  onPanResponderMove?: ?PassiveCallback,
  onPanResponderTerminate?: ?PassiveCallback,
  onPanResponderTerminationRequest?: ?ActiveCallback,
  onShouldBlockNativeResponder?: ?ActiveCallback,
|}>;

export type PanResponderType = {
  _initializeGestureState: (gestureState: GestureState) => void,
  _updateGestureStateOnMove: (
    gestureState: GestureState,
    touchHistory: $PropertyType<PressEvent, 'touchHistory'>,
  ) => void,
  /**
   * @param {object} config Enhanced versions of all of the responder callbacks
   * that provide not only the typical `ResponderSyntheticEvent`, but also the
   * `PanResponder` gesture state.  Simply replace the word `Responder` with
   * `PanResponder` in each of the typical `onResponder*` callbacks. For
   * example, the `config` object would look like:
   *
   *  - `onMoveShouldSetPanResponder: (e, gestureState) => {...}`
   *  - `onMoveShouldSetPanResponderCapture: (e, gestureState) => {...}`
   *  - `onStartShouldSetPanResponder: (e, gestureState) => {...}`
   *  - `onStartShouldSetPanResponderCapture: (e, gestureState) => {...}`
   *  - `onPanResponderReject: (e, gestureState) => {...}`
   *  - `onPanResponderGrant: (e, gestureState) => {...}`
   *  - `onPanResponderStart: (e, gestureState) => {...}`
   *  - `onPanResponderEnd: (e, gestureState) => {...}`
   *  - `onPanResponderRelease: (e, gestureState) => {...}`
   *  - `onPanResponderMove: (e, gestureState) => {...}`
   *  - `onPanResponderTerminate: (e, gestureState) => {...}`
   *  - `onPanResponderTerminationRequest: (e, gestureState) => {...}`
   *  - `onShouldBlockNativeResponder: (e, gestureState) => {...}`
   *
   *  In general, for events that have capture equivalents, we update the
   *  gestureState once in the capture phase and can use it in the bubble phase
   *  as well.
   *
   *  Be careful with onStartShould* callbacks. They only reflect updated
   *  `gestureState` for start/end events that bubble/capture to the Node.
   *  Once the node is the responder, you can rely on every start/end event
   *  being processed by the gesture and `gestureState` being updated
   *  accordingly. (numberActiveTouches) may not be totally accurate unless you
   *  are the responder.
   */
  create: (config: PanResponderConfig) => {
    getInteractionHandle: () => ?number,
    panHandlers: PanHandlers,
  },
};
