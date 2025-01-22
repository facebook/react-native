/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 *
 * @format
 */

export type {CompositeAnimation, Numeric} from './AnimatedImplementation';

import AnimatedFlatList from './components/AnimatedFlatList';
import type AnimatedImage from './components/AnimatedImage';
import type AnimatedScrollView from './components/AnimatedScrollView';
import type AnimatedSectionList from './components/AnimatedSectionList';
import type AnimatedText from './components/AnimatedText';
import type AnimatedView from './components/AnimatedView';

// This requires the implementation of AnimatedImplementation to use ES6 exports.
import * as AnimatedImplementation from './AnimatedImplementation';

declare class TestClass {}

declare namespace Animated {
  const Test: typeof TestClass;
  const FlatList: typeof AnimatedFlatList;
  const Image: typeof AnimatedImage;
  const ScrollView: typeof AnimatedScrollView;
  const SectionList: typeof AnimatedSectionList;
  const Text: typeof AnimatedText;
  const View: typeof AnimatedView;
  const Value: typeof AnimatedImplementation.Value;
  const ValueXY: typeof AnimatedImplementation.ValueXY;
  const Color: typeof AnimatedImplementation.Color;
  const Interpolation: typeof AnimatedImplementation.Interpolation;
  const Node: typeof AnimatedImplementation.Node;
  const Event: typeof AnimatedImplementation.Event;
  const decay: typeof AnimatedImplementation.decay;
  const timing: typeof AnimatedImplementation.timing;
  const spring: typeof AnimatedImplementation.spring;
  const add: typeof AnimatedImplementation.add;
  const subtract: typeof AnimatedImplementation.subtract;
  const divide: typeof AnimatedImplementation.divide;
  const multiply: typeof AnimatedImplementation.multiply;
  const modulo: typeof AnimatedImplementation.modulo;
  const diffClamp: typeof AnimatedImplementation.diffClamp;
  const delay: typeof AnimatedImplementation.delay;
  const sequence: typeof AnimatedImplementation.sequence;
  const parallel: typeof AnimatedImplementation.parallel;
  const stagger: typeof AnimatedImplementation.stagger;
  const loop: typeof AnimatedImplementation.loop;
  const event: typeof AnimatedImplementation.event;
  const createAnimatedComponent: typeof AnimatedImplementation.createAnimatedComponent;
  const attachNativeEvent: typeof AnimatedImplementation.attachNativeEvent;
  const forkEvent: typeof AnimatedImplementation.forkEvent;
  const unforkEvent: typeof AnimatedImplementation.unforkEvent;

  type FlatList = typeof AnimatedFlatList;
  type Image = typeof AnimatedImage;
  type ScrollView = typeof AnimatedScrollView;
  type SectionList = typeof AnimatedSectionList;
  type Text = typeof AnimatedText;
  type View = typeof AnimatedView;
  type Value = AnimatedImplementation.Value;
  type ValueXY = AnimatedImplementation.ValueXY;
  type Color = AnimatedImplementation.Color;
  type Interpolation<T extends string | number> =
    AnimatedImplementation.Interpolation<T>;
  type Node = AnimatedImplementation.Node;
  type Event = AnimatedImplementation.Event;
  type decay = typeof AnimatedImplementation.decay;
  type timing = typeof AnimatedImplementation.timing;
  type spring = typeof AnimatedImplementation.spring;
  type add = typeof AnimatedImplementation.add;
  type subtract = typeof AnimatedImplementation.subtract;
  type divide = typeof AnimatedImplementation.divide;
  type multiply = typeof AnimatedImplementation.multiply;
  type modulo = typeof AnimatedImplementation.modulo;
  type diffClamp = typeof AnimatedImplementation.diffClamp;
  type delay = typeof AnimatedImplementation.delay;
  type sequence = typeof AnimatedImplementation.sequence;
  type parallel = typeof AnimatedImplementation.parallel;
  type stagger = typeof AnimatedImplementation.stagger;
  type loop = typeof AnimatedImplementation.loop;
  type event = typeof AnimatedImplementation.event;
  type createAnimatedComponent =
    typeof AnimatedImplementation.createAnimatedComponent;
  type attachNativeEvent = typeof AnimatedImplementation.attachNativeEvent;
  type forkEvent = typeof AnimatedImplementation.forkEvent;
  type unforkEvent = typeof AnimatedImplementation.unforkEvent;
}

export default Animated;
