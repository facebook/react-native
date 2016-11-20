/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule NavigationPagerPanResponder
 * @flow
 */
'use strict';

const Animated = require('Animated');
const NavigationAbstractPanResponder = require('NavigationAbstractPanResponder');
const NavigationCardStackPanResponder = require('NavigationCardStackPanResponder');
const I18nManager = require('I18nManager');

const clamp = require('clamp');

import type {
  NavigationPanPanHandlers,
  NavigationSceneRendererProps,
} from 'NavigationTypeDefinition';

import type {
  NavigationGestureDirection,
} from 'NavigationCardStackPanResponder';

type Props = NavigationSceneRendererProps & {
  onNavigateBack: ?Function,
  onNavigateForward: ?Function,
};

/**
 * Primitive gesture directions.
 */
const {
  ANIMATION_DURATION,
  POSITION_THRESHOLD,
  RESPOND_THRESHOLD,
  Directions,
} = NavigationCardStackPanResponder;

/**
 * The threshold (in pixels) to finish the gesture action.
 */
const DISTANCE_THRESHOLD = 50;

/**
 * The threshold to trigger the gesture action. This determines the rate of the
 * flick when the action will be triggered
 */
const VELOCITY_THRESHOLD = 1.5;

/**
 * Pan responder that handles gesture for a card in the cards list.
 *
 * +-------------+-------------+-------------+
 * |             |             |             |
 * |             |             |             |
 * |             |             |             |
 * |    Next     |   Focused   |  Previous   |
 * |    Card     |    Card     |    Card     |
 * |             |             |             |
 * |             |             |             |
 * |             |             |             |
 * +-------------+-------------+-------------+
 */
class NavigationPagerPanResponder extends NavigationAbstractPanResponder {

  _isResponding: boolean;
  _isVertical: boolean;
  _props: Props;
  _startValue: number;

  constructor(
    direction: NavigationGestureDirection,
    props: Props,
  ) {
    super();
    this._isResponding = false;
    this._isVertical = direction === Directions.VERTICAL;
    this._props = props;
    this._startValue = 0;
  }

  onMoveShouldSetPanResponder(event: any, gesture: any): boolean {
    const props = this._props;

    if (props.navigationState.index !== props.scene.index) {
      return false;
    }

    const layout = props.layout;
    const isVertical = this._isVertical;
    const axis = isVertical ? 'dy' : 'dx';
    const index = props.navigationState.index;
    const distance = isVertical ?
      layout.height.__getValue() :
      layout.width.__getValue();

    return (
      Math.abs(gesture[axis]) > RESPOND_THRESHOLD &&
      distance > 0 &&
      index >= 0
    );
  }

  onPanResponderGrant(): void {
    this._isResponding = false;
    this._props.position.stopAnimation((value: number) => {
      this._isResponding = true;
      this._startValue = value;
    });
  }

  onPanResponderMove(event: any, gesture: any): void {
    if (!this._isResponding) {
      return;
    }

    const {
      layout,
      navigationState,
      position,
      scenes,
    } = this._props;

    const isVertical = this._isVertical;
    const axis = isVertical ? 'dy' : 'dx';
    const index = navigationState.index;
    const distance = isVertical ?
      layout.height.__getValue() :
      layout.width.__getValue();
    const currentValue = I18nManager.isRTL && axis === 'dx' ?
      this._startValue + (gesture[axis] / distance) :
      this._startValue - (gesture[axis] / distance);

    const prevIndex = Math.max(
      0,
      index - 1,
    );

    const nextIndex = Math.min(
      index + 1,
      scenes.length - 1,
    );

    const value = clamp(
      prevIndex,
      currentValue,
      nextIndex,
    );

    position.setValue(value);
  }

  onPanResponderRelease(event: any, gesture: any): void {
    if (!this._isResponding) {
      return;
    }

    this._isResponding = false;

    const {
      navigationState,
      onNavigateBack,
      onNavigateForward,
      position,
    } = this._props;

    const isVertical = this._isVertical;
    const axis = isVertical ? 'dy' : 'dx';
    const velocityAxis = isVertical ? 'vy' : 'vx';
    const index = navigationState.index;
    const distance = I18nManager.isRTL && axis === 'dx' ?
      -gesture[axis] :
      gesture[axis];
    const moveSpeed = I18nManager.isRTL && velocityAxis === 'vx' ?
      -gesture[velocityAxis] :
      gesture[velocityAxis];

    position.stopAnimation((value: number) => {
      this._reset();
      if (
        distance > DISTANCE_THRESHOLD  ||
        value <= index - POSITION_THRESHOLD ||
        moveSpeed > VELOCITY_THRESHOLD
      ) {
        onNavigateBack && onNavigateBack();
        return;
      }

      if (
        distance < -DISTANCE_THRESHOLD ||
        value >= index  + POSITION_THRESHOLD ||
        moveSpeed < -VELOCITY_THRESHOLD
      ) {
        onNavigateForward && onNavigateForward();
      }
    });
  }

  onPanResponderTerminate(): void {
    this._isResponding = false;
    this._reset();
  }

  _reset(): void {
    const props = this._props;
    Animated.timing(
      props.position,
      {
        toValue: props.navigationState.index,
        duration: ANIMATION_DURATION,
      }
    ).start();
  }
}

function createPanHandlers(
  direction: NavigationGestureDirection,
  props: Props,
): NavigationPanPanHandlers {
  const responder = new NavigationPagerPanResponder(direction, props);
  return responder.panHandlers;
}

function forHorizontal(
  props: Props,
): NavigationPanPanHandlers {
  return createPanHandlers(Directions.HORIZONTAL, props);
}

module.exports = {
  forHorizontal,
};
