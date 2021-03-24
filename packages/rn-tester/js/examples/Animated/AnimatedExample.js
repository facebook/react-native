/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

import type {RNTesterExampleModuleItem} from '../../types/RNTesterTypes';
import RotatingImagesExample from './RotatingImagesExample';
import ContinuousInteractionsExample from './ContinuousInteractionsExample';
import MovingBoxExample from './MovingBoxExample';
import FadeInViewExample from './FadeInViewExample';
import ComposeAnimationsWithEasingExample from './ComposeAnimationsWithEasingExample';
import TransformBounceExample from './TransformBounceExample';

exports.framework = 'React';
exports.title = 'Animated - Examples';
exports.category = 'UI';
exports.documentationURL = 'https://reactnative.dev/docs/animated';
exports.description = ('Animated provides a powerful ' +
  'and easy-to-use API for building modern, ' +
  'interactive user experiences.': string);

exports.examples = ([
  FadeInViewExample,
  ComposeAnimationsWithEasingExample,
  RotatingImagesExample,
  MovingBoxExample,
  TransformBounceExample,
  ContinuousInteractionsExample,
]: Array<RNTesterExampleModuleItem>);
