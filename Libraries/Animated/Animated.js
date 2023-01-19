/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

export type {CompositeAnimation, Numeric} from './AnimatedImplementation';

import typeof AnimatedFlatList from './components/AnimatedFlatList';
import typeof AnimatedImage from './components/AnimatedImage';
import typeof AnimatedScrollView from './components/AnimatedScrollView';
import typeof AnimatedSectionList from './components/AnimatedSectionList';
import typeof AnimatedText from './components/AnimatedText';
import typeof AnimatedView from './components/AnimatedView';

import Platform from '../Utilities/Platform';
import AnimatedImplementation from './AnimatedImplementation';
import AnimatedMock from './AnimatedMock';

const Animated = ((Platform.isTesting
  ? AnimatedMock
  : AnimatedImplementation): typeof AnimatedImplementation);

export default {
  get FlatList(): AnimatedFlatList {
    return require('./components/AnimatedFlatList').default;
  },
  get Image(): AnimatedImage {
    return require('./components/AnimatedImage').default;
  },
  get ScrollView(): AnimatedScrollView {
    return require('./components/AnimatedScrollView').default;
  },
  get SectionList(): AnimatedSectionList {
    return require('./components/AnimatedSectionList').default;
  },
  get Text(): AnimatedText {
    return require('./components/AnimatedText').default;
  },
  get View(): AnimatedView {
    return require('./components/AnimatedView').default;
  },
  ...Animated,
};
