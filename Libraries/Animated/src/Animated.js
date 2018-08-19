/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

const AnimatedImplementation = require('AnimatedImplementation');
const FlatList = require('FlatList');
const Image = require('Image');
const ScrollView = require('ScrollView');
const SectionList = require('SectionList');
const Text = require('Text');
const View = require('View');

module.exports = {
  ...AnimatedImplementation,
  View: AnimatedImplementation.createAnimatedComponent(View),
  Text: AnimatedImplementation.createAnimatedComponent(Text),
  Image: AnimatedImplementation.createAnimatedComponent(Image),
  ScrollView: AnimatedImplementation.createAnimatedComponent(ScrollView),
  FlatList: AnimatedImplementation.createAnimatedComponent(FlatList),
  SectionList: AnimatedImplementation.createAnimatedComponent(SectionList),
};
