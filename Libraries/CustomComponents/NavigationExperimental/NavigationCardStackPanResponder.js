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
 * @typechecks
 */
'use strict';

const Animated = require('Animated');
const NavigationAbstractPanResponder = require('NavigationAbstractPanResponder');

const clamp = require('clamp');

import type {
  NavigationPanPanHandlers,
  NavigationSceneRendererProps,
} from 'NavigationTypeDefinition';

/**
 * The duration of the card animation in milliseconds.
 */
const ANIMATION_DURATION = 250;

/**
 * The threshold to invoke the `onNavigate` action.
 * For instance, `1 / 3` means that moving greater than 1 / 3 of the width of
 * the view will navigate.
 */
const POSITION_THRESHOLD = 1 / 3;

/**
 * The threshold (in pixels) to start the gesture action.
 */
const RESPOND_THRESHOLD = 15;

/**
 * The distance from the edge of the navigator which gesture response can start for.
 * For horizontal scroll views, a distance of 30 from the left of the screen is the
 * standard maximum position to start touch responsiveness.
 */
const RESPOND_POSITION_MAX_HORIZONTAL = 30;
const RESPOND_POSITION_MAX_VERTICAL = null;

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

/**
 * Primitive gesture actions.
 */
const Actions = {
  // The gesture to navigate backward.
  // This is done by swiping from the left to the right or from the top to the
  // bottom.
  BACK: {type: 'back'},
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
  _props: NavigationSceneRendererProps;
  _startValue: number;

  constructor(
    direction: NavigationGestureDirection,
    props: NavigationSceneRendererProps,
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
    const index = props.navigationState.index;
    const currentDragDistance = gesture[isVertical ? 'dy' : 'dx'];
    const currentDragPosition = gesture[isVertical ? 'moveY' : 'moveX'];
    const maxDragDistance = isVertical ?
      layout.height.__getValue() :
      layout.width.__getValue();

    const positionMax = isVertical ?
      RESPOND_POSITION_MAX_VERTICAL :
      RESPOND_POSITION_MAX_HORIZONTAL;

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

    const value = clamp(
      index - 1,
      this._startValue - (gesture[axis] / distance),
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
    const distance = gesture[axis];

    props.position.stopAnimation((value: number) => {
      this._reset();
       if (distance > DISTANCE_THRESHOLD  || value <= index - POSITION_THRESHOLD) {
        props.onNavigate(Actions.BACK);
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
  props: NavigationSceneRendererProps,
): NavigationPanPanHandlers {
  const responder = new NavigationCardStackPanResponder(direction, props);
  return responder.panHandlers;
}

function forHorizontal(
  props: NavigationSceneRendererProps,
): NavigationPanPanHandlers {
  return createPanHandlers(Directions.HORIZONTAL, props);
}

function forVertical(
  props: NavigationSceneRendererProps,
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
  Actions,
  Directions,

  // methods.
  forHorizontal,
  forVertical,
};
