/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

import type {EdgeInsetsProp} from '../../StyleSheet/EdgeInsetsPropType';
import type {ColorValue} from '../../StyleSheet/StyleSheet';
import type {PressEvent} from '../../Types/CoreEventTypes';

import * as React from 'react';

/**
 * `Touchable`: Taps done right.
 *
 * You hook your `ResponderEventPlugin` events into `Touchable`. `Touchable`
 * will measure time/geometry and tells you when to give feedback to the user.
 *
 * ====================== Touchable Tutorial ===============================
 * The `Touchable` mixin helps you handle the "press" interaction. It analyzes
 * the geometry of elements, and observes when another responder (scroll view
 * etc) has stolen the touch lock. It notifies your component when it should
 * give feedback to the user. (bouncing/highlighting/unhighlighting).
 *
 * - When a touch was activated (typically you highlight)
 * - When a touch was deactivated (typically you unhighlight)
 * - When a touch was "pressed" - a touch ended while still within the geometry
 *   of the element, and no other element (like scroller) has "stolen" touch
 *   lock ("responder") (Typically you bounce the element).
 *
 * A good tap interaction isn't as simple as you might think. There should be a
 * slight delay before showing a highlight when starting a touch. If a
 * subsequent touch move exceeds the boundary of the element, it should
 * unhighlight, but if that same touch is brought back within the boundary, it
 * should rehighlight again. A touch can move in and out of that boundary
 * several times, each time toggling highlighting, but a "press" is only
 * triggered if that touch ends while within the element's boundary and no
 * scroller (or anything else) has stolen the lock on touches.
 *
 * To create a new type of component that handles interaction using the
 * `Touchable` mixin, do the following:
 *
 * - Initialize the `Touchable` state.
 *
 *   getInitialState: function() {
 *     return merge(this.touchableGetInitialState(), yourComponentState);
 *   }
 *
 * - Choose the rendered component who's touches should start the interactive
 *   sequence. On that rendered node, forward all `Touchable` responder
 *   handlers. You can choose any rendered node you like. Choose a node whose
 *   hit target you'd like to instigate the interaction sequence:
 *
 *   // In render function:
 *   return (
 *     <View
 *       onStartShouldSetResponder={this.touchableHandleStartShouldSetResponder}
 *       onResponderTerminationRequest={this.touchableHandleResponderTerminationRequest}
 *       onResponderGrant={this.touchableHandleResponderGrant}
 *       onResponderMove={this.touchableHandleResponderMove}
 *       onResponderRelease={this.touchableHandleResponderRelease}
 *       onResponderTerminate={this.touchableHandleResponderTerminate}>
 *       <View>
 *         Even though the hit detection/interactions are triggered by the
 *         wrapping (typically larger) node, we usually end up implementing
 *         custom logic that highlights this inner one.
 *       </View>
 *     </View>
 *   );
 *
 * - You may set up your own handlers for each of these events, so long as you
 *   also invoke the `touchable*` handlers inside of your custom handler.
 *
 * - Implement the handlers on your component class in order to provide
 *   feedback to the user. See documentation for each of these class methods
 *   that you should implement.
 *
 *   touchableHandlePress: function() {
 *      this.performBounceAnimation();  // or whatever you want to do.
 *   },
 *   touchableHandleActivePressIn: function() {
 *     this.beginHighlighting(...);  // Whatever you like to convey activation
 *   },
 *   touchableHandleActivePressOut: function() {
 *     this.endHighlighting(...);  // Whatever you like to convey deactivation
 *   },
 *
 * - There are more advanced methods you can implement (see documentation below):
 *   touchableGetHighlightDelayMS: function() {
 *     return 20;
 *   }
 *   // In practice, *always* use a predeclared constant (conserve memory).
 *   touchableGetPressRectOffset: function() {
 *     return {top: 20, left: 20, right: 20, bottom: 100};
 *   }
 */

/**
 * Touchable states.
 */

const States = {
  NOT_RESPONDER: 'NOT_RESPONDER', // Not the responder
  RESPONDER_INACTIVE_PRESS_IN: 'RESPONDER_INACTIVE_PRESS_IN', // Responder, inactive, in the `PressRect`
  RESPONDER_INACTIVE_PRESS_OUT: 'RESPONDER_INACTIVE_PRESS_OUT', // Responder, inactive, out of `PressRect`
  RESPONDER_ACTIVE_PRESS_IN: 'RESPONDER_ACTIVE_PRESS_IN', // Responder, active, in the `PressRect`
  RESPONDER_ACTIVE_PRESS_OUT: 'RESPONDER_ACTIVE_PRESS_OUT', // Responder, active, out of `PressRect`
  RESPONDER_ACTIVE_LONG_PRESS_IN: 'RESPONDER_ACTIVE_LONG_PRESS_IN', // Responder, active, in the `PressRect`, after long press threshold
  RESPONDER_ACTIVE_LONG_PRESS_OUT: 'RESPONDER_ACTIVE_LONG_PRESS_OUT', // Responder, active, out of `PressRect`, after long press threshold
  ERROR: 'ERROR',
};

type State =
  | typeof States.NOT_RESPONDER
  | typeof States.RESPONDER_INACTIVE_PRESS_IN
  | typeof States.RESPONDER_INACTIVE_PRESS_OUT
  | typeof States.RESPONDER_ACTIVE_PRESS_IN
  | typeof States.RESPONDER_ACTIVE_PRESS_OUT
  | typeof States.RESPONDER_ACTIVE_LONG_PRESS_IN
  | typeof States.RESPONDER_ACTIVE_LONG_PRESS_OUT
  | typeof States.ERROR;

/**
 * By convention, methods prefixed with underscores are meant to be @private,
 * and not @protected. Mixers shouldn't access them - not even to provide them
 * as callback handlers.
 *
 *
 * ========== Geometry =========
 * `Touchable` only assumes that there exists a `HitRect` node. The `PressRect`
 * is an abstract box that is extended beyond the `HitRect`.
 *
 *  +--------------------------+
 *  |                          | - "Start" events in `HitRect` cause `HitRect`
 *  |  +--------------------+  |   to become the responder.
 *  |  |  +--------------+  |  | - `HitRect` is typically expanded around
 *  |  |  |              |  |  |   the `VisualRect`, but shifted downward.
 *  |  |  |  VisualRect  |  |  | - After pressing down, after some delay,
 *  |  |  |              |  |  |   and before letting up, the Visual React
 *  |  |  +--------------+  |  |   will become "active". This makes it eligible
 *  |  |     HitRect        |  |   for being highlighted (so long as the
 *  |  +--------------------+  |   press remains in the `PressRect`).
 *  |        PressRect     o   |
 *  +----------------------|---+
 *           Out Region    |
 *                         +-----+ This gap between the `HitRect` and
 *                                 `PressRect` allows a touch to move far away
 *                                 from the original hit rect, and remain
 *                                 highlighted, and eligible for a "Press".
 *                                 Customize this via
 *                                 `touchableGetPressRectOffset()`.
 *
 *
 *
 * ======= State Machine =======
 *
 * +-------------+ <---+ RESPONDER_RELEASE
 * |NOT_RESPONDER|
 * +-------------+ <---+ RESPONDER_TERMINATED
 *     +
 *     | RESPONDER_GRANT (HitRect)
 *     v
 * +---------------------------+  DELAY   +-------------------------+  T + DELAY     +------------------------------+
 * |RESPONDER_INACTIVE_PRESS_IN|+-------->|RESPONDER_ACTIVE_PRESS_IN| +------------> |RESPONDER_ACTIVE_LONG_PRESS_IN|
 * +---------------------------+          +-------------------------+                +------------------------------+
 *     +            ^                         +           ^                                 +           ^
 *     |LEAVE_      |ENTER_                   |LEAVE_     |ENTER_                           |LEAVE_     |ENTER_
 *     |PRESS_RECT  |PRESS_RECT               |PRESS_RECT |PRESS_RECT                       |PRESS_RECT |PRESS_RECT
 *     |            |                         |           |                                 |           |
 *     v            +                         v           +                                 v           +
 * +----------------------------+  DELAY  +--------------------------+               +-------------------------------+
 * |RESPONDER_INACTIVE_PRESS_OUT|+------->|RESPONDER_ACTIVE_PRESS_OUT|               |RESPONDER_ACTIVE_LONG_PRESS_OUT|
 * +----------------------------+         +--------------------------+               +-------------------------------+
 *
 * T + DELAY => LONG_PRESS_DELAY_MS + DELAY
 *
 * Not drawn are the side effects of each transition. The most important side
 * effect is the `touchableHandlePress` abstract method invocation that occurs
 * when a responder is released while in either of the "Press" states.
 *
 * The other important side effects are the highlight abstract method
 * invocations (internal callbacks) to be implemented by the mixer.
 *
 *
 * @lends Touchable.prototype
 */
interface TouchableMixinType {
  /**
   * Invoked when the item receives focus. Mixers might override this to
   * visually distinguish the `VisualRect` so that the user knows that it
   * currently has the focus. Most platforms only support a single element being
   * focused at a time, in which case there may have been a previously focused
   * element that was blurred just prior to this. This can be overridden when
   * using `Touchable.Mixin.withoutDefaultFocusAndBlur`.
   */
  touchableHandleFocus: (e: Event) => void;

  /**
   * Invoked when the item loses focus. Mixers might override this to
   * visually distinguish the `VisualRect` so that the user knows that it
   * no longer has focus. Most platforms only support a single element being
   * focused at a time, in which case the focus may have moved to another.
   * This can be overridden when using
   * `Touchable.Mixin.withoutDefaultFocusAndBlur`.
   */
  touchableHandleBlur: (e: Event) => void;

  componentDidMount: () => void;

  /**
   * Clear all timeouts on unmount
   */
  componentWillUnmount: () => void;

  /**
   * It's prefer that mixins determine state in this way, having the class
   * explicitly mix the state in the one and only `getInitialState` method.
   *
   * @return {object} State object to be placed inside of
   * `this.state.touchable`.
   */
  touchableGetInitialState: () => {
    touchable: {
      touchState: ?State,
      responderID: ?PressEvent['currentTarget'],
    },
  };

  // ==== Hooks to Gesture Responder system ====
  /**
   * Must return true if embedded in a native platform scroll view.
   */
  touchableHandleResponderTerminationRequest: () => any;

  /**
   * Must return true to start the process of `Touchable`.
   */
  touchableHandleStartShouldSetResponder: () => any;

  /**
   * Return true to cancel press on long press.
   */
  touchableLongPressCancelsPress: () => boolean;

  /**
   * Place as callback for a DOM element's `onResponderGrant` event.
   * @param {SyntheticEvent} e Synthetic event from event system.
   *
   */
  touchableHandleResponderGrant: (e: PressEvent) => void;

  /**
   * Place as callback for a DOM element's `onResponderRelease` event.
   */
  touchableHandleResponderRelease: (e: PressEvent) => void;

  /**
   * Place as callback for a DOM element's `onResponderTerminate` event.
   */
  touchableHandleResponderTerminate: (e: PressEvent) => void;

  /**
   * Place as callback for a DOM element's `onResponderMove` event.
   */
  touchableHandleResponderMove: (e: PressEvent) => void;

  withoutDefaultFocusAndBlur: {...};
}

export type TouchableType = {
  Mixin: TouchableMixinType,
  /**
   * Renders a debugging overlay to visualize touch target with hitSlop (might not work on Android).
   */
  renderDebugView: ({
    color: ColorValue,
    hitSlop: EdgeInsetsProp,
    ...
  }) => null | React.Node,
};
