/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @providesModule NavigationLinearPanResponder
 * @flow
 * @typechecks
 */
'use strict';

const Animated = require('Animated');
const NavigationAbstractPanResponder = require('NavigationAbstractPanResponder');

const clamp = require('clamp');

import type {
  NavigationActionCaller,
  NavigationLayout,
  NavigationPosition,
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
 * The threshold (in speed) to finish the gesture action.
 */
const VELOCITY_THRESHOLD = 100;

/**
 * Primitive gesture directions.
 */
const Directions = {
  'HORIZONTAL': 'horizontal',
  'VERTICAL': 'vertical',
};

export type NavigationGestureDirection =  $Enum<typeof Directions>;

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
 * The type interface of the object that provides the information required by
 * NavigationLinearPanResponder.
 */
export type NavigationLinearPanResponderDelegate = {
  getDirection: () => NavigationGestureDirection;
  getIndex: () => number,
  getLayout: () => NavigationLayout,
  getPosition: () => NavigationPosition,
  onNavigate: NavigationActionCaller,
};

/**
 * Pan responder that handles the One-dimensional gesture (horizontal or
 * vertical).
 */
class NavigationLinearPanResponder extends NavigationAbstractPanResponder {
  static Actions: Object;
  static Directions: Object;

  _isResponding: boolean;
  _startValue: number;
  _delegate: NavigationLinearPanResponderDelegate;

  constructor(delegate: NavigationLinearPanResponderDelegate) {
    super();
    this._isResponding = false;
    this._startValue = 0;
    this._delegate = delegate;
  }

  onMoveShouldSetPanResponder(event: any, gesture: any): boolean {
    const delegate = this._delegate;
    const layout = delegate.getLayout();
    const isVertical = delegate.getDirection() === Directions.VERTICAL;
    const axis = isVertical ? 'dy' : 'dx';
    const index = delegate.getIndex();
    const distance = isVertical ?
      layout.height.__getValue() :
      layout.width.__getValue();

    return (
      Math.abs(gesture[axis]) > RESPOND_THRESHOLD &&
      distance > 0 &&
      index > 0
    );
  }

  onPanResponderGrant(): void {
    this._isResponding = false;
    this._delegate.getPosition().stopAnimation((value: number) => {
      this._isResponding = true;
      this._startValue = value;
    });
  }

  onPanResponderMove(event: any, gesture: any): void {
    if (!this._isResponding) {
      return;
    }

    const delegate = this._delegate;
    const layout = delegate.getLayout();
    const isVertical = delegate.getDirection() === Directions.VERTICAL;
    const axis = isVertical ? 'dy' : 'dx';
    const index = delegate.getIndex();
    const distance = isVertical ?
      layout.height.__getValue() :
      layout.width.__getValue();

    const value = clamp(
      index - 1,
      this._startValue - (gesture[axis] / distance),
      index
    );

    this._delegate.getPosition().setValue(value);
  }

  onPanResponderRelease(event: any, gesture: any): void {
    if (!this._isResponding) {
      return;
    }

    this._isResponding = false;

    const delegate = this._delegate;
    const isVertical = delegate.getDirection() === Directions.VERTICAL;
    const axis = isVertical ? 'dy' : 'dx';
    const index = delegate.getIndex();
    const velocity = gesture[axis];

    delegate.getPosition().stopAnimation((value: number) => {
      this._reset();
       if (velocity > VELOCITY_THRESHOLD  || value <= index - POSITION_THRESHOLD) {
        delegate.onNavigate(Actions.BACK);
      }
    });
  }

  onPanResponderTerminate(): void {
    this._isResponding = false;
    this._reset();
  }

  _reset(): void {
    Animated.timing(
      this._delegate.getPosition(),
      {
        toValue: this._delegate.getIndex(),
        duration: ANIMATION_DURATION,
      }
    ).start();
  }
}

NavigationLinearPanResponder.Actions = Actions;
NavigationLinearPanResponder.Directions = Directions;

module.exports = NavigationLinearPanResponder;
