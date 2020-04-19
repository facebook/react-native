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

import Platform from '../../Utilities/Platform';
const View = require('../../Components/View/View');
const React = require('react');
import type {AnimatedComponentType} from './createAnimatedComponent';

const AnimatedMock = require('./AnimatedMock');
const AnimatedImplementation = require('./AnimatedImplementation');

//TODO(T57411659): Remove the bridgeless check when Animated perf regressions are fixed.
const Animated = ((Platform.isTesting || global.RN$Bridgeless
  ? AnimatedMock
  : AnimatedImplementation): typeof AnimatedMock);

module.exports = {
  get FlatList(): any {
    return require('./components/AnimatedFlatList');
  },
  get Image(): any {
    return require('./components/AnimatedImage');
  },
  get ScrollView(): any {
    return require('./components/AnimatedScrollView');
  },
  get SectionList(): any {
    return require('./components/AnimatedSectionList');
  },
  get Text(): any {
    return require('./components/AnimatedText');
  },
  get View(): AnimatedComponentType<
    React.ElementConfig<typeof View>,
    React.ElementRef<typeof View>,
  > {
    return require('./components/AnimatedView');
  },
  ...Animated,
};
