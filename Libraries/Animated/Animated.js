/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

import Platform from '../Utilities/Platform';
import typeof AnimatedFlatList from './components/AnimatedFlatList';
import typeof AnimatedImage from './components/AnimatedImage';
import typeof AnimatedScrollView from './components/AnimatedScrollView';
import typeof AnimatedSectionList from './components/AnimatedSectionList';
import typeof AnimatedText from './components/AnimatedText';
import typeof AnimatedView from './components/AnimatedView';

import * as AnimatedMock from './AnimatedMock';
import * as AnimatedImplementation from './AnimatedImplementation';

const Animated = ((Platform.isTesting
  ? AnimatedMock
  : AnimatedImplementation): typeof AnimatedMock);

module.exports = {
  get FlatList(): AnimatedFlatList {
    return require('./components/AnimatedFlatList');
  },
  get Image(): AnimatedImage {
    return require('./components/AnimatedImage');
  },
  get ScrollView(): AnimatedScrollView {
    return require('./components/AnimatedScrollView');
  },
  get SectionList(): AnimatedSectionList {
    return require('./components/AnimatedSectionList');
  },
  get Text(): AnimatedText {
    return require('./components/AnimatedText');
  },
  get View(): AnimatedView {
    return require('./components/AnimatedView');
  },
  ...Animated,
};
