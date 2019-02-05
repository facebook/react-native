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

const AnimatedImplementation = require('AnimatedImplementation');
const AnimatedValueXY = require('./nodes/AnimatedValueXY');
const AnimatedValue = require('./nodes/AnimatedValue');

import type {EndCallback} from './animations/Animation';
import type {TimingAnimationConfig} from './animations/TimingAnimation';
import type {DecayAnimationConfig} from './animations/DecayAnimation';
import type {SpringAnimationConfig} from './animations/SpringAnimation';
import type {Mapping, EventConfig} from './AnimatedEvent';

/**
 * Animations are a source of flakiness in snapshot testing. This mock replaces
 * animation functions from AnimatedImplementation with empty animations for
 * predictability in tests.
 */
type CompositeAnimation = {
  start: (callback?: ?EndCallback) => void,
  stop: () => void,
  reset: () => void,
  _startNativeLoop: (iterations?: number) => void,
  _isUsingNativeDriver: () => boolean,
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
  return emptyAnimation;
};

const timing = function(
  value: AnimatedValue | AnimatedValueXY,
  config: TimingAnimationConfig,
): CompositeAnimation {
  return emptyAnimation;
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

type ParallelConfig = {
  stopTogether?: boolean,
};
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

type LoopAnimationConfig = {iterations: number};

const loop = function(
  animation: CompositeAnimation,
  {iterations = -1}: LoopAnimationConfig = {},
): CompositeAnimation {
  return emptyAnimation;
};

const event = function(argMapping: Array<?Mapping>, config?: EventConfig): any {
  return null;
};

module.exports = {
  ...AnimatedImplementation,
  decay,
  timing,
  spring,
  delay,
  sequence,
  parallel,
  stagger,
  loop,
  event,
};
