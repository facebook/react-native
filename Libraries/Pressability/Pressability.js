/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

import {isHoverEnabled} from './HoverState.js';
import invariant from 'invariant';
import SoundManager from '../Components/Sound/SoundManager.js';
import type {EdgeInsetsProp} from '../StyleSheet/EdgeInsetsPropType.js';
import type {
  BlurEvent,
  FocusEvent,
  PressEvent,
  MouseEvent,
} from '../Types/CoreEventTypes.js';
import Platform from '../Utilities/Platform';
import UIManager from '../ReactNative/UIManager';
import type {HostComponent} from '../Renderer/shims/ReactNativeTypes';
import * as React from 'react';

export type PressabilityConfig = $ReadOnly<{|
  /**
   * Returns the amount to extend the `VisualRect` by to create `HitRect`.
   */
  getHitSlop?: ?() => ?EdgeInsetsProp,

  /**
   * Returns the duration to wait after hover in before activation.
   */
  getHoverInDelayMS?: ?() => ?number,

  /**
   * Returns the duration to wait after hover out before deactivation.
   */
  getHoverOutDelayMS?: ?() => ?number,

  /**
   * Returns the duration (in addition to the value from `getPressDelayMS`)
   * after which a press gesture becomes a long press gesture.
   */
  getLongPressDelayMS?: ?() => ?number,

  /**
   * Returns the duration to wait after press down before activation.
   */
  getPressDelayMS?: ?() => ?number,

  /**
   * Returns the duration to wait after letting up before deactivation.
   */
  getPressOutDelayMS?: ?() => ?number,

  /**
   * Returns the amount to extend the `HitRect` by to create `PressRect`.
   */
  getPressRectOffset?: ?() => ?EdgeInsetsProp,

  /**
   * Returns true to disable playing system sound on touch (Android Only)
   **/
  getTouchSoundDisabled?: ?() => ?boolean,

  /**
   * Called after the element loses focus.
   */
  onBlur?: ?(event: BlurEvent) => void,

  /**
   * Called after the element is focused.
   */
  onFocus?: ?(event: FocusEvent) => void,

  /**
   * Called when the hover is activated to provide visual feedback.
   */
  onHoverIn?: ?(event: MouseEvent) => void,

  /**
   * Called when the hover is deactivated to undo visual feedback.
   */
  onHoverOut?: ?(event: MouseEvent) => void,

  /**
   * Called when a long press gesture has been triggered.
   */
  onLongPress?: ?(event: PressEvent) => void,

  /**
   * Returns whether a long press gesture should cancel the press gesture.
   * Defaults to true.
   */
  onLongPressShouldCancelPress?: ?() => boolean,

  /**
   * Called when a press gestute has been triggered.
   */
  onPress?: ?(event: PressEvent) => void,

  /**
   * Called when the press is activated to provide visual feedback.
   */
  onPressIn?: ?(event: PressEvent) => void,

  /**
   * Called when the press location moves. (This should rarely be used.)
   */
  onPressMove?: ?(event: PressEvent) => void,

  /**
   * Called when the press is deactivated to undo visual feedback.
   */
  onPressOut?: ?(event: PressEvent) => void,

  /**
   * Returns whether to yield to a lock termination request (e.g. if a native
   * scroll gesture attempts to steal the responder lock).
   */
  onResponderTerminationRequest?: ?() => boolean,

  /**
   * Returns whether to start a press gesture.
   */
  onStartShouldSetResponder?: ?() => boolean,
|}>;

type EventHandlers = $ReadOnly<{|
  onBlur: (event: BlurEvent) => void,
  onClick: (event: PressEvent) => void,
  onFocus: (event: FocusEvent) => void,
  onMouseEnter?: (event: MouseEvent) => void,
  onMouseLeave?: (event: MouseEvent) => void,
  onResponderGrant: (event: PressEvent) => void,
  onResponderMove: (event: PressEvent) => void,
  onResponderRelease: (event: PressEvent) => void,
  onResponderTerminate: (event: PressEvent) => void,
  onResponderTerminationRequest: () => boolean,
  onStartShouldSetResponder: () => boolean,
|}>;

type TouchState =
  | 'NOT_RESPONDER'
  | 'RESPONDER_INACTIVE_PRESS_IN'
  | 'RESPONDER_INACTIVE_PRESS_OUT'
  | 'RESPONDER_ACTIVE_PRESS_IN'
  | 'RESPONDER_ACTIVE_PRESS_OUT'
  | 'RESPONDER_ACTIVE_LONG_PRESS_IN'
  | 'RESPONDER_ACTIVE_LONG_PRESS_OUT'
  | 'ERROR';

type TouchSignal =
  | 'DELAY'
  | 'RESPONDER_GRANT'
  | 'RESPONDER_RELEASE'
  | 'RESPONDER_TERMINATED'
  | 'ENTER_PRESS_RECT'
  | 'LEAVE_PRESS_RECT'
  | 'LONG_PRESS_DETECTED';

const Transitions = Object.freeze({
  NOT_RESPONDER: {
    DELAY: 'ERROR',
    RESPONDER_GRANT: 'RESPONDER_INACTIVE_PRESS_IN',
    RESPONDER_RELEASE: 'ERROR',
    RESPONDER_TERMINATED: 'ERROR',
    ENTER_PRESS_RECT: 'ERROR',
    LEAVE_PRESS_RECT: 'ERROR',
    LONG_PRESS_DETECTED: 'ERROR',
  },
  RESPONDER_INACTIVE_PRESS_IN: {
    DELAY: 'RESPONDER_ACTIVE_PRESS_IN',
    RESPONDER_GRANT: 'ERROR',
    RESPONDER_RELEASE: 'NOT_RESPONDER',
    RESPONDER_TERMINATED: 'NOT_RESPONDER',
    ENTER_PRESS_RECT: 'RESPONDER_INACTIVE_PRESS_IN',
    LEAVE_PRESS_RECT: 'RESPONDER_INACTIVE_PRESS_OUT',
    LONG_PRESS_DETECTED: 'ERROR',
  },
  RESPONDER_INACTIVE_PRESS_OUT: {
    DELAY: 'RESPONDER_ACTIVE_PRESS_OUT',
    RESPONDER_GRANT: 'ERROR',
    RESPONDER_RELEASE: 'NOT_RESPONDER',
    RESPONDER_TERMINATED: 'NOT_RESPONDER',
    ENTER_PRESS_RECT: 'RESPONDER_INACTIVE_PRESS_IN',
    LEAVE_PRESS_RECT: 'RESPONDER_INACTIVE_PRESS_OUT',
    LONG_PRESS_DETECTED: 'ERROR',
  },
  RESPONDER_ACTIVE_PRESS_IN: {
    DELAY: 'ERROR',
    RESPONDER_GRANT: 'ERROR',
    RESPONDER_RELEASE: 'NOT_RESPONDER',
    RESPONDER_TERMINATED: 'NOT_RESPONDER',
    ENTER_PRESS_RECT: 'RESPONDER_ACTIVE_PRESS_IN',
    LEAVE_PRESS_RECT: 'RESPONDER_ACTIVE_PRESS_OUT',
    LONG_PRESS_DETECTED: 'RESPONDER_ACTIVE_LONG_PRESS_IN',
  },
  RESPONDER_ACTIVE_PRESS_OUT: {
    DELAY: 'ERROR',
    RESPONDER_GRANT: 'ERROR',
    RESPONDER_RELEASE: 'NOT_RESPONDER',
    RESPONDER_TERMINATED: 'NOT_RESPONDER',
    ENTER_PRESS_RECT: 'RESPONDER_ACTIVE_PRESS_IN',
    LEAVE_PRESS_RECT: 'RESPONDER_ACTIVE_PRESS_OUT',
    LONG_PRESS_DETECTED: 'ERROR',
  },
  RESPONDER_ACTIVE_LONG_PRESS_IN: {
    DELAY: 'ERROR',
    RESPONDER_GRANT: 'ERROR',
    RESPONDER_RELEASE: 'NOT_RESPONDER',
    RESPONDER_TERMINATED: 'NOT_RESPONDER',
    ENTER_PRESS_RECT: 'RESPONDER_ACTIVE_LONG_PRESS_IN',
    LEAVE_PRESS_RECT: 'RESPONDER_ACTIVE_LONG_PRESS_OUT',
    LONG_PRESS_DETECTED: 'RESPONDER_ACTIVE_LONG_PRESS_IN',
  },
  RESPONDER_ACTIVE_LONG_PRESS_OUT: {
    DELAY: 'ERROR',
    RESPONDER_GRANT: 'ERROR',
    RESPONDER_RELEASE: 'NOT_RESPONDER',
    RESPONDER_TERMINATED: 'NOT_RESPONDER',
    ENTER_PRESS_RECT: 'RESPONDER_ACTIVE_LONG_PRESS_IN',
    LEAVE_PRESS_RECT: 'RESPONDER_ACTIVE_LONG_PRESS_OUT',
    LONG_PRESS_DETECTED: 'ERROR',
  },
  ERROR: {
    DELAY: 'NOT_RESPONDER',
    RESPONDER_GRANT: 'RESPONDER_INACTIVE_PRESS_IN',
    RESPONDER_RELEASE: 'NOT_RESPONDER',
    RESPONDER_TERMINATED: 'NOT_RESPONDER',
    ENTER_PRESS_RECT: 'NOT_RESPONDER',
    LEAVE_PRESS_RECT: 'NOT_RESPONDER',
    LONG_PRESS_DETECTED: 'NOT_RESPONDER',
  },
});

const isActiveSignal = signal =>
  signal === 'RESPONDER_ACTIVE_PRESS_IN' ||
  signal === 'RESPONDER_ACTIVE_LONG_PRESS_IN';

const isActivationSignal = signal =>
  signal === 'RESPONDER_ACTIVE_PRESS_OUT' ||
  signal === 'RESPONDER_ACTIVE_PRESS_IN';

const isPressInSignal = signal =>
  signal === 'RESPONDER_INACTIVE_PRESS_IN' ||
  signal === 'RESPONDER_ACTIVE_PRESS_IN' ||
  signal === 'RESPONDER_ACTIVE_LONG_PRESS_IN';

const isTerminalSignal = signal =>
  signal === 'RESPONDER_TERMINATED' || signal === 'RESPONDER_RELEASE';

const DEFAULT_LONG_PRESS_DELAY_MS = 500;
const DEFAULT_PRESS_DELAY_MS = 0;
const DEFAULT_PRESS_RECT_OFFSETS = {
  bottom: 30,
  left: 20,
  right: 20,
  top: 20,
};

/**
 * Pressability implements press handling capabilities.
 *
 * =========================== Pressability Tutorial ===========================
 *
 * The `Pressability` class helps you create press interactions by analyzing the
 * geometry of elements and observing when another responder (e.g. ScrollView)
 * has stolen the touch lock. It offers hooks for your component to provide
 * interaction feedback to the user:
 *
 * - When a press has activated (e.g. highlight an element)
 * - When a press has deactivated (e.g. un-highlight an element)
 * - When a press sould trigger an action, meaning it activated and deactivated
 *   while within the geometry of the element without the lock being stolen.
 *
 * A high quality interaction isn't as simple as you might think. There should
 * be a slight delay before activation. Moving your finger beyond an element's
 * bounds should trigger deactivation, but moving the same finger back within an
 * element's bounds should trigger reactivation.
 *
 * In order to use `Pressability`, do the following:
 *
 * 1. Instantiate `Pressability` and store it on your component's state.
 *
 *    state = {
 *      pressability: new Pressability({
 *        // ...
 *      }),
 *    };
 *
 * 2. Choose the rendered component who should collect the press events. On that
 *    element, spread `pressability.getEventHandlers()` into its props.
 *
 *    return (
 *      <View {...this.state.pressability.getEventHandlers()} />
 *    );
 *
 * 3. Reset `Pressability` when your component unmounts.
 *
 *    componentWillUnmount() {
 *      this.state.pressability.reset();
 *    }
 *
 * ==================== Pressability Implementation Details ====================
 *
 * `Pressability` only assumes that there exists a `HitRect` node. The `PressRect`
 * is an abstract box that is extended beyond the `HitRect`.
 *
 * # Geometry
 *
 *  ┌────────────────────────┐
 *  │  ┌──────────────────┐  │ - Presses start anywhere within `HitRect`, which
 *  │  │  ┌────────────┐  │  │   is expanded via the prop `getHitSlop`.
 *  │  │  │ VisualRect │  │  │
 *  │  │  └────────────┘  │  │ - When pressed down for sufficient amount of time
 *  │  │    HitRect       │  │   before letting up, `VisualRect` activates for
 *  │  └──────────────────┘  │   as long as the press stays within `PressRect`.
 *  │       PressRect    o   │
 *  └────────────────────│───┘
 *          Out Region   └────── `PressRect`, which is expanded via the prop
 *                               `getPressRectOffset`, allows presses to move
 *                               beyond `HitRect` while maintaining activation
 *                               and being eligible for a "press".
 *
 * # State Machine
 *
 * ┌───────────────┐ ◀──── RESPONDER_RELEASE
 * │ NOT_RESPONDER │
 * └───┬───────────┘ ◀──── RESPONDER_TERMINATED
 *     │
 *     │ RESPONDER_GRANT (HitRect)
 *     │
 *     ▼
 * ┌─────────────────────┐          ┌───────────────────┐              ┌───────────────────┐
 * │ RESPONDER_INACTIVE_ │  DELAY   │ RESPONDER_ACTIVE_ │  T + DELAY   │ RESPONDER_ACTIVE_ │
 * │ PRESS_IN            ├────────▶ │ PRESS_IN          ├────────────▶ │ LONG_PRESS_IN     │
 * └─┬───────────────────┘          └─┬─────────────────┘              └─┬─────────────────┘
 *   │           ▲                    │           ▲                      │           ▲
 *   │LEAVE_     │                    │LEAVE_     │                      │LEAVE_     │
 *   │PRESS_RECT │ENTER_              │PRESS_RECT │ENTER_                │PRESS_RECT │ENTER_
 *   │           │PRESS_RECT          │           │PRESS_RECT            │           │PRESS_RECT
 *   ▼           │                    ▼           │                      ▼           │
 * ┌─────────────┴───────┐          ┌─────────────┴─────┐              ┌─────────────┴─────┐
 * │ RESPONDER_INACTIVE_ │  DELAY   │ RESPONDER_ACTIVE_ │              │ RESPONDER_ACTIVE_ │
 * │ PRESS_OUT           ├────────▶ │ PRESS_OUT         │              │ LONG_PRESS_OUT    │
 * └─────────────────────┘          └───────────────────┘              └───────────────────┘
 *
 * T + DELAY => LONG_PRESS_DELAY + DELAY
 *
 * Not drawn are the side effects of each transition. The most important side
 * effect is the invocation of `onPress` and `onLongPress` that occur when a
 * responder is release while in the "press in" states.
 */
export default class Pressability {
  _config: PressabilityConfig;
  _eventHandlers: ?EventHandlers = null;
  _hoverInDelayTimeout: ?TimeoutID = null;
  _hoverOutDelayTimeout: ?TimeoutID = null;
  _isHovered: boolean = false;
  _longPressDelayTimeout: ?TimeoutID = null;
  _pressDelayTimeout: ?TimeoutID = null;
  _pressOutDelayTimeout: ?TimeoutID = null;
  _responderID: ?number | React.ElementRef<HostComponent<mixed>> = null;
  _responderRegion: ?$ReadOnly<{|
    bottom: number,
    left: number,
    right: number,
    top: number,
  |}> = null;
  _touchActivatePosition: ?$ReadOnly<{|
    pageX: number,
    pageY: number,
  |}>;
  _touchState: TouchState = 'NOT_RESPONDER';

  constructor(config: PressabilityConfig) {
    this._config = config;
  }

  /**
   * Resets any pending timers. This should be called on unmount.
   */
  reset(): void {
    this._cancelHoverInDelayTimeout();
    this._cancelHoverOutDelayTimeout();
    this._cancelLongPressDelayTimeout();
    this._cancelPressDelayTimeout();
    this._cancelPressOutDelayTimeout();
  }

  /**
   * Returns a set of props to spread into the interactive element.
   */
  getEventHandlers(): EventHandlers {
    if (this._eventHandlers == null) {
      this._eventHandlers = this._createEventHandlers();
    }
    return this._eventHandlers;
  }

  _createEventHandlers(): EventHandlers {
    const focusEventHandlers = {
      onBlur: (event: BlurEvent): void => {
        const {onBlur} = this._config;
        if (onBlur != null) {
          onBlur(event);
        }
      },
      onFocus: (event: FocusEvent): void => {
        const {onFocus} = this._config;
        if (onFocus != null) {
          onFocus(event);
        }
      },
    };

    const responderEventHandlers = {
      onStartShouldSetResponder: () => {
        const {onStartShouldSetResponder} = this._config;
        return onStartShouldSetResponder == null
          ? true
          : onStartShouldSetResponder();
      },

      onResponderGrant: (event: PressEvent): void => {
        event.persist();

        this._cancelPressOutDelayTimeout();

        this._responderID = event.currentTarget;
        this._touchState = 'NOT_RESPONDER';
        this._receiveSignal('RESPONDER_GRANT', event);

        const {getLongPressDelayMS, getPressDelayMS} = this._config;

        const pressDelay = getDelayMS(
          getPressDelayMS,
          0,
          DEFAULT_PRESS_DELAY_MS,
        );
        if (pressDelay > 0) {
          this._pressDelayTimeout = setTimeout(() => {
            this._receiveSignal('DELAY', event);
          }, pressDelay);
        } else {
          this._receiveSignal('DELAY', event);
        }

        const longPressDelay = getDelayMS(
          getLongPressDelayMS,
          10,
          DEFAULT_LONG_PRESS_DELAY_MS,
        );
        this._longPressDelayTimeout = setTimeout(() => {
          this._handleLongPress(event);
        }, longPressDelay + pressDelay);
      },

      onResponderMove: (event: PressEvent): void => {
        if (this._config.onPressMove != null) {
          this._config.onPressMove(event);
        }

        // Region may not have finished being measured, yet.
        const responderRegion = this._responderRegion;
        if (responderRegion == null) {
          return;
        }

        const touch = getTouchFromPressEvent(event);
        if (touch == null) {
          this._cancelLongPressDelayTimeout();
          this._receiveSignal('LEAVE_PRESS_RECT', event);
          return;
        }

        if (this._touchActivatePosition != null) {
          const deltaX = this._touchActivatePosition.pageX - touch.pageX;
          const deltaY = this._touchActivatePosition.pageY - touch.pageY;
          if (Math.hypot(deltaX, deltaY) > 10) {
            this._cancelLongPressDelayTimeout();
          }
        }

        if (this._isTouchWithinResponderRegion(touch, responderRegion)) {
          this._receiveSignal('ENTER_PRESS_RECT', event);
        } else {
          this._cancelLongPressDelayTimeout();
          this._receiveSignal('LEAVE_PRESS_RECT', event);
        }
      },

      onResponderRelease: (event: PressEvent): void => {
        this._receiveSignal('RESPONDER_RELEASE', event);
      },

      onResponderTerminate: (event: PressEvent): void => {
        this._receiveSignal('RESPONDER_TERMINATED', event);
      },

      onResponderTerminationRequest: (): boolean => {
        const {onResponderTerminationRequest} = this._config;
        return onResponderTerminationRequest == null
          ? true
          : onResponderTerminationRequest();
      },

      onClick: (event: PressEvent) => {
        const {onPress} = this._config;
        if (onPress != null) {
          onPress(event);
        }
      },
    };

    const mouseEventHandlers =
      Platform.OS === 'ios' || Platform.OS === 'android'
        ? null
        : {
            onMouseEnter: (event: MouseEvent): void => {
              if (isHoverEnabled()) {
                this._isHovered = true;
                this._cancelHoverOutDelayTimeout();
                const {onHoverIn, getHoverInDelayMS} = this._config;
                if (onHoverIn != null) {
                  const delay = getDelayMS(getHoverInDelayMS);
                  if (delay > 0) {
                    this._hoverInDelayTimeout = setTimeout(() => {
                      onHoverIn(event);
                    }, delay);
                  } else {
                    onHoverIn(event);
                  }
                }
              }
            },

            onMouseLeave: (event: MouseEvent): void => {
              if (this._isHovered) {
                this._isHovered = false;
                this._cancelHoverInDelayTimeout();
                const {onHoverOut, getHoverOutDelayMS} = this._config;
                if (onHoverOut != null) {
                  const delay = getDelayMS(getHoverOutDelayMS);
                  if (delay > 0) {
                    this._hoverInDelayTimeout = setTimeout(() => {
                      onHoverOut(event);
                    }, delay);
                  } else {
                    onHoverOut(event);
                  }
                }
              }
            },
          };

    return {
      ...focusEventHandlers,
      ...responderEventHandlers,
      ...mouseEventHandlers,
    };
  }

  /**
   * Receives a state machine signal, performs side effects of the transition
   * and stores the new state. Validates the transition as well.
   */
  _receiveSignal(signal: TouchSignal, event: PressEvent): void {
    const prevState = this._touchState;
    const nextState = Transitions[prevState]?.[signal];
    if (this._responderID == null && signal === 'RESPONDER_RELEASE') {
      return;
    }
    invariant(
      nextState != null && nextState !== 'ERROR',
      'Pressability: Invalid signal `%s` for state `%s` on responder: %s',
      signal,
      prevState,
      typeof this._responderID === 'number'
        ? this._responderID
        : '<<host component>>',
    );
    if (prevState !== nextState) {
      this._performTransitionSideEffects(prevState, nextState, signal, event);
      this._touchState = nextState;
    }
  }

  /**
   * Performs a transition between touchable states and identify any activations
   * or deactivations (and callback invocations).
   */
  _performTransitionSideEffects(
    prevState: TouchState,
    nextState: TouchState,
    signal: TouchSignal,
    event: PressEvent,
  ): void {
    if (isTerminalSignal(signal)) {
      this._touchActivatePosition = null;
      this._cancelLongPressDelayTimeout();
    }

    const isInitialTransition =
      prevState === 'NOT_RESPONDER' &&
      nextState === 'RESPONDER_INACTIVE_PRESS_IN';

    const isActivationTransiton =
      !isActivationSignal(prevState) && isActivationSignal(nextState);

    if (isInitialTransition || isActivationTransiton) {
      this._measureResponderRegion();
    }

    if (isPressInSignal(prevState) && signal === 'LONG_PRESS_DETECTED') {
      const {onLongPress} = this._config;
      if (onLongPress != null) {
        onLongPress(event);
      }
    }

    const isPrevActive = isActiveSignal(prevState);
    const isNextActive = isActiveSignal(nextState);

    if (!isPrevActive && isNextActive) {
      this._activate(event);
    } else if (isPrevActive && !isNextActive) {
      this._deactivate(event);
    }

    if (isPressInSignal(prevState) && signal === 'RESPONDER_RELEASE') {
      const {onLongPress, onPress, getTouchSoundDisabled} = this._config;
      if (onPress != null) {
        const isPressCanceledByLongPress =
          onLongPress != null &&
          prevState === 'RESPONDER_ACTIVE_LONG_PRESS_IN' &&
          this._shouldLongPressCancelPress();
        if (!isPressCanceledByLongPress) {
          // If we never activated (due to delays), activate and deactivate now.
          if (!isNextActive && !isPrevActive) {
            this._activate(event);
            this._deactivate(event);
          }
          const isTouchSoundDisabled =
            (getTouchSoundDisabled == null ? null : getTouchSoundDisabled()) ??
            false;
          if (Platform.OS === 'android' && !isTouchSoundDisabled) {
            SoundManager.playTouchSound();
          }
          onPress(event);
        }
      }
    }

    this._cancelPressDelayTimeout();
  }

  _activate(event: PressEvent): void {
    const {onPressIn} = this._config;
    const touch = getTouchFromPressEvent(event);
    this._touchActivatePosition = {
      pageX: touch.pageX,
      pageY: touch.pageY,
    };
    if (onPressIn != null) {
      onPressIn(event);
    }
  }

  _deactivate(event: PressEvent): void {
    const {onPressOut, getPressOutDelayMS} = this._config;
    if (onPressOut != null) {
      const delay = getDelayMS(getPressOutDelayMS);
      if (delay > 0) {
        this._pressOutDelayTimeout = setTimeout(() => {
          onPressOut(event);
        }, delay);
      } else {
        onPressOut(event);
      }
    }
  }

  _measureResponderRegion(): void {
    if (this._responderID == null) {
      return;
    }

    if (typeof this._responderID === 'number') {
      UIManager.measure(this._responderID, this._measureCallback);
    } else {
      this._responderID.measure(this._measureCallback);
    }
  }

  _measureCallback = (left, top, width, height, pageX, pageY) => {
    if (!left && !top && !width && !height && !pageX && !pageY) {
      return;
    }
    this._responderRegion = {
      bottom: pageY + height,
      left: pageX,
      right: pageX + width,
      top: pageY,
    };
  };

  _isTouchWithinResponderRegion(
    touch: $PropertyType<PressEvent, 'nativeEvent'>,
    responderRegion: $ReadOnly<{|
      bottom: number,
      left: number,
      right: number,
      top: number,
    |}>,
  ): boolean {
    const {getHitSlop, getPressRectOffset} = this._config;

    let regionBottom = responderRegion.bottom;
    let regionLeft = responderRegion.left;
    let regionRight = responderRegion.right;
    let regionTop = responderRegion.top;

    const hitSlop = getHitSlop == null ? null : getHitSlop();
    if (hitSlop != null) {
      if (hitSlop.bottom != null) {
        regionBottom += hitSlop.bottom;
      }
      if (hitSlop.left != null) {
        regionLeft -= hitSlop.left;
      }
      if (hitSlop.right != null) {
        regionRight += hitSlop.right;
      }
      if (hitSlop.top != null) {
        regionTop -= hitSlop.top;
      }
    }

    const rectOffset = getPressRectOffset == null ? null : getPressRectOffset();
    regionBottom +=
      rectOffset == null || rectOffset.bottom == null
        ? DEFAULT_PRESS_RECT_OFFSETS.bottom
        : rectOffset.bottom;
    regionLeft -=
      rectOffset == null || rectOffset.left == null
        ? DEFAULT_PRESS_RECT_OFFSETS.left
        : rectOffset.left;
    regionRight +=
      rectOffset == null || rectOffset.right == null
        ? DEFAULT_PRESS_RECT_OFFSETS.right
        : rectOffset.right;
    regionTop -=
      rectOffset == null || rectOffset.top == null
        ? DEFAULT_PRESS_RECT_OFFSETS.top
        : rectOffset.top;

    return (
      touch.pageX > regionLeft &&
      touch.pageX < regionRight &&
      touch.pageY > regionTop &&
      touch.pageY < regionBottom
    );
  }

  _handleLongPress(event: PressEvent): void {
    if (
      this._touchState === 'RESPONDER_ACTIVE_PRESS_IN' ||
      this._touchState === 'RESPONDER_ACTIVE_LONG_PRESS_IN'
    ) {
      this._receiveSignal('LONG_PRESS_DETECTED', event);
    }
  }

  _shouldLongPressCancelPress(): boolean {
    return (
      this._config.onLongPressShouldCancelPress == null ||
      this._config.onLongPressShouldCancelPress()
    );
  }

  _cancelHoverInDelayTimeout(): void {
    if (this._hoverInDelayTimeout != null) {
      clearTimeout(this._hoverInDelayTimeout);
      this._hoverInDelayTimeout = null;
    }
  }

  _cancelHoverOutDelayTimeout(): void {
    if (this._hoverOutDelayTimeout != null) {
      clearTimeout(this._hoverOutDelayTimeout);
      this._hoverOutDelayTimeout = null;
    }
  }

  _cancelLongPressDelayTimeout(): void {
    if (this._longPressDelayTimeout != null) {
      clearTimeout(this._longPressDelayTimeout);
      this._longPressDelayTimeout = null;
    }
  }

  _cancelPressDelayTimeout(): void {
    if (this._pressDelayTimeout != null) {
      clearTimeout(this._pressDelayTimeout);
      this._pressDelayTimeout = null;
    }
  }

  _cancelPressOutDelayTimeout(): void {
    if (this._pressOutDelayTimeout != null) {
      clearTimeout(this._pressOutDelayTimeout);
      this._pressOutDelayTimeout = null;
    }
  }
}

const getDelayMS = (getDelay: ?() => ?number, min = 0, fallback = 0) => {
  return Math.max(min, (getDelay == null ? null : getDelay()) ?? fallback);
};

const getTouchFromPressEvent = (event: PressEvent) => {
  const {changedTouches, touches} = event.nativeEvent;

  if (touches != null && touches.length > 0) {
    return touches[0];
  }
  if (changedTouches != null && changedTouches.length > 0) {
    return changedTouches[0];
  }
  return event.nativeEvent;
};
