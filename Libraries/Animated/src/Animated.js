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

import Platform from 'Platform';

const AnimatedImplementation = Platform.isTesting
  ? require('AnimatedMock')
  : require('AnimatedImplementation');

module.exports = {
  get FlatList() {
    return require('AnimatedFlatList');
  },
  get Image() {
    return require('AnimatedImage');
  },
  get ScrollView() {
    return require('AnimatedScrollView');
  },
  get SectionList() {
    return require('AnimatedSectionList');
  },
  get Text() {
    return require('AnimatedText');
  },
  get View() {
    return require('AnimatedView');
  },
  ...AnimatedImplementation,
};
