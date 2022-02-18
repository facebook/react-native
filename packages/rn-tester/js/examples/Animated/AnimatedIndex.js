/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {RNTesterModule} from '../../types/RNTesterTypes';
import RotatingImagesExample from './RotatingImagesExample';
import ContinuousInteractionsExample from './ContinuousInteractionsExample';
import LoopingExample from './LoopingExample';
import MovingBoxExample from './MovingBoxExample';
import EasingExample from './EasingExample';
import FadeInViewExample from './FadeInViewExample';
import ComposeAnimationsWithEasingExample from './ComposeAnimationsWithEasingExample';
import TransformBounceExample from './TransformBounceExample';
import ComposingExample from './ComposingExample';
import TransformStylesExample from './TransformStylesExample';
import ColorStylesExample from './ColorStylesExample';

export default ({
  framework: 'React',
  title: 'Animated',
  category: 'UI',
  documentationURL: 'https://reactnative.dev/docs/animated',
  description:
    'Library designed to make animations fluid, powerful, and painless to ' +
    'build and maintain.',
  showIndividualExamples: true,
  examples: [
    TransformStylesExample,
    ColorStylesExample,
    FadeInViewExample,
    ComposingExample,
    EasingExample,
    ComposeAnimationsWithEasingExample,
    RotatingImagesExample,
    MovingBoxExample,
    TransformBounceExample,
    LoopingExample,
    ContinuousInteractionsExample,
  ],
}: RNTesterModule);
