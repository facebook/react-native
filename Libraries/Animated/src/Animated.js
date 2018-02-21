/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @providesModule Animated
 * @flow
 * @format
 */

'use strict';

const AnimatedImplementation = require('AnimatedImplementation');
const Image = require('Image');
const ScrollView = require('ScrollView');
const Text = require('Text');
const View = require('View');

const Animated = {
  View: AnimatedImplementation.createAnimatedComponent(View),
  Text: AnimatedImplementation.createAnimatedComponent(Text),
  Image: AnimatedImplementation.createAnimatedComponent(Image),
  ScrollView: AnimatedImplementation.createAnimatedComponent(ScrollView),
};

Object.assign((Animated: Object), AnimatedImplementation);

module.exports = ((Animated: any): typeof AnimatedImplementation &
  typeof Animated);
