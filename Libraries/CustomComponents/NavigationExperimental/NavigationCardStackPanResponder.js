/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule NavigationCardStackPanResponder
 * @flow
 */
'use strict';

const Animated = require('Animated');
const I18nManager = require('I18nManager');
const NavigationAbstractPanResponder = require('NavigationAbstractPanResponder');

const clamp = require('clamp');

import type {
  NavigationPanPanHandlers,
  NavigationSceneRendererProps,
} from 'NavigationTypeDefinition';

const emptyFunction = () => {};

/**
 * The duration of the card animation in milliseconds.
 */
const ANIMATION_DURATION = 250;

/**
 * The threshold to invoke the `onNavigateBack` action.
 * For instance, `1 / 3` means that moving greater than 1 / 3 of the width of
 * the view will navigate.
 */
const POSITION_THRESHOLD = 1 / 3;

/**
 * The threshold (in pixels) to start the gesture action.
 */
const RESPOND_THRESHOLD = 15;

/**
 * The threshold (in pixels) to finish the gesture action.
 */
const DISTANCE_THRESHOLD = 100;

/**
 * Primitive gesture directions.
 */
const Directions = {
  'HORIZONTAL': 'horizontal',
  'VERTICAL': 'vertical',
};

export type NavigationGestureDirection =  'horizontal' | 'vertical';

type Props = NavigationSceneRendererProps & {
  onNavigateBack: ?Function,
  /**
  * The distance from the edge of the navigator which gesture response can start for.
  **/
  gestureResponseDistance: ?number,
};

/**
 * Pan responder that handles gesture for a card in the cards stack.
 *
 *     +------------+
 *   +-+            |
 * +-+ |            |
 * | | |            |
 * | | |  Focused   |
 * | | |   Card     |
 * | | |            |
 * +-+ |            |
 *   +-+            |
 *     +------------+
 */
class NavigationCardStackPanResponder extends NavigationAbstractPanResponder {

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

    // Hack to make this work with native driven animations. We add a single listener
    // so the JS value of the following animated values gets updated. We rely on
    // some Animated private APIs and not doing so would require using a bunch of
    // value listeners but we'd have to remove them to not leak and I'm not sure
    // when we'd do that with the current structure we have. `stopAnimation` callback
    // is also broken with native animated values that have no listeners so if we
    // want to remove this we have to fix this too.
    this._addNativeListener(this._props.layout.width);
    this._addNativeListener(this._props.layout.height);
    this._addNativeListener(this._props.position);
  }

  onMoveShouldSetPanResponder(event: any, gesture: any): boolean {
    const props = this._props;

    if (props.navigationState.index !== props.scene.index) {
      return false;
    }

    const layout = props.layout;
    const isVertical = this._isVertical;
    const index = props.navigationState.index;
    const currentDragDistance = gesture[isVertical ? 'dy' : 'dx'];
    const currentDragPosition = gesture[isVertical ? 'moveY' : 'moveX'];
    const maxDragDistance = isVertical ?
      layout.height.__getValue() :
      layout.width.__getValue();

    const positionMax = isVertical ?
      props.gestureResponseDistance :
      /**
      * For horizontal scroll views, a distance of 30 from the left of the screen is the
      * standard maximum position to start touch responsiveness.
      */
      props.gestureResponseDistance || 30;

    if (positionMax != null && currentDragPosition > positionMax) {
      return false;
    }

    return (
      Math.abs(currentDragDistance) > RESPOND_THRESHOLD &&
      maxDragDistance > 0 &&
      index > 0
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

    const props = this._props;
    const layout = props.layout;
    const isVertical = this._isVertical;
    const axis = isVertical ? 'dy' : 'dx';
    const index = props.navigationState.index;
    const distance = isVertical ?
      layout.height.__getValue() :
      layout.width.__getValue();
    const currentValue = I18nManager.isRTL && axis === 'dx' ?
      this._startValue + (gesture[axis] / distance) :
      this._startValue - (gesture[axis] / distance);

    const value = clamp(
      index - 1,
      currentValue,
      index
    );

    props.position.setValue(value);
  }

  onPanResponderRelease(event: any, gesture: any): void {
    if (!this._isResponding) {
      return;
    }

    this._isResponding = false;

    const props = this._props;
    const isVertical = this._isVertical;
    const axis = isVertical ? 'dy' : 'dx';
    const index = props.navigationState.index;
    const distance = I18nManager.isRTL && axis === 'dx' ?
      -gesture[axis] :
      gesture[axis];

    props.position.stopAnimation((value: number) => {
      this._reset();

      if (!props.onNavigateBack) {
        return;
      }

      if (
        distance > DISTANCE_THRESHOLD  ||
        value <= index - POSITION_THRESHOLD
      ) {
        props.onNavigateBack();
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
        useNativeDriver: props.position.__isNative,
      }
    ).start();
  }

  _addNativeListener(animatedValue) {
    if (!animatedValue.__isNative) {
      return;
    }

    if (Object.keys(animatedValue._listeners).length === 0) {
      animatedValue.addListener(emptyFunction);
    }
  }
}

function createPanHandlers(
  direction: NavigationGestureDirection,
  props: Props,
): NavigationPanPanHandlers {
  const responder = new NavigationCardStackPanResponder(direction, props);
  return responder.panHandlers;
}

function forHorizontal(
  props: Props,
): NavigationPanPanHandlers {
  return createPanHandlers(Directions.HORIZONTAL, props);
}

function forVertical(
  props: Props,
): NavigationPanPanHandlers {
  return createPanHandlers(Directions.VERTICAL, props);
}

module.exports = {
  // constants
  ANIMATION_DURATION,
  DISTANCE_THRESHOLD,
  POSITION_THRESHOLD,
  RESPOND_THRESHOLD,

  // enums
  Directions,

  // methods.
  forHorizontal,
  forVertical,
};
