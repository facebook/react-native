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

const AnimatedImplementation = Platform.isTesting
  ? require('./AnimatedMock')
  : require('./AnimatedImplementation');

module.exports = {
  get FlatList() {
    return require('./components/AnimatedFlatList');
  },
  get Image() {
    return require('./components/AnimatedImage');
  },
  get ScrollView() {
    return require('./components/AnimatedScrollView');
  },
  get SectionList() {
    return require('./components/AnimatedSectionList');
  },
  get Text() {
    return require('./components/AnimatedText');
  },
  get View() {
    return require('./components/AnimatedView');
  },
  ...AnimatedImplementation,
};
