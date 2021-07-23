/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

'use strict';

const {AnimatedEvent, attachNativeEvent} = require('./AnimatedEvent');
const AnimatedImplementation = require('./AnimatedImplementation');
const AnimatedInterpolation = require('./nodes/AnimatedInterpolation');
const AnimatedNode = require('./nodes/AnimatedNode');
const AnimatedValue = require('./nodes/AnimatedValue');
const AnimatedValueXY = require('./nodes/AnimatedValueXY');

const createAnimatedComponent = require('./createAnimatedComponent');

import type {EndCallback} from './animations/Animation';
import type {TimingAnimationConfig} from './animations/TimingAnimation';
import type {DecayAnimationConfig} from './animations/DecayAnimation';
import type {SpringAnimationConfig} from './animations/SpringAnimation';

/**
 * Animations are a source of flakiness in snapshot testing. This mock replaces
 * animation functions from AnimatedImplementation with empty animations for
 * predictability in tests.
 */
export type CompositeAnimation = {
  start: (callback?: ?EndCallback) => void,
  stop: () => void,
  reset: () => void,
  _startNativeLoop: (iterations?: number) => void,
  _isUsingNativeDriver: () => boolean,
  ...
};

const emptyAnimation = {
  start: () => {},
  stop: () => {},
  reset: () => {},
  _startNativeLoop: () => {},
  _isUsingNativeDriver: () => {
    return false;
  },
};

const spring = function(
  value: AnimatedValue | AnimatedValueXY,
  config: SpringAnimationConfig,
): CompositeAnimation {
  const anyValue: any = value;
  return {
    ...emptyAnimation,
    start: (callback?: ?EndCallback): void => {
      anyValue.setValue(config.toValue);
      callback && callback({finished: true});
    },
  };
};

const timing = function(
  value: AnimatedValue | AnimatedValueXY,
  config: TimingAnimationConfig,
): CompositeAnimation {
  const anyValue: any = value;
  return {
    ...emptyAnimation,
    start: (callback?: ?EndCallback): void => {
      anyValue.setValue(config.toValue);
      callback && callback({finished: true});
    },
  };
};

const decay = function(
  value: AnimatedValue | AnimatedValueXY,
  config: DecayAnimationConfig,
): CompositeAnimation {
  return emptyAnimation;
};

const sequence = function(
  animations: Array<CompositeAnimation>,
): CompositeAnimation {
  return emptyAnimation;
};

type ParallelConfig = {stopTogether?: boolean, ...};
const parallel = function(
  animations: Array<CompositeAnimation>,
  config?: ?ParallelConfig,
): CompositeAnimation {
  return emptyAnimation;
};

const delay = function(time: number): CompositeAnimation {
  return emptyAnimation;
};

const stagger = function(
  time: number,
  animations: Array<CompositeAnimation>,
): CompositeAnimation {
  return emptyAnimation;
};

type LoopAnimationConfig = {
  iterations: number,
  resetBeforeIteration?: boolean,
  ...
};

const loop = function(
  animation: CompositeAnimation,
  {iterations = -1}: LoopAnimationConfig = {},
): CompositeAnimation {
  return emptyAnimation;
};

module.exports = {
  Value: AnimatedValue,
  ValueXY: AnimatedValueXY,
  Interpolation: AnimatedInterpolation,
  Node: AnimatedNode,
  decay,
  timing,
  spring,
  add: AnimatedImplementation.add,
  subtract: AnimatedImplementation.subtract,
  divide: AnimatedImplementation.divide,
  multiply: AnimatedImplementation.multiply,
  modulo: AnimatedImplementation.modulo,
  diffClamp: AnimatedImplementation.diffClamp,
  delay,
  sequence,
  parallel,
  stagger,
  loop,
  event: AnimatedImplementation.event,
  createAnimatedComponent,
  attachNativeEvent,
  forkEvent: AnimatedImplementation.forkEvent,
  unforkEvent: AnimatedImplementation.unforkEvent,
  Event: AnimatedEvent,
};
