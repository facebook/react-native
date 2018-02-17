/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @providesModule Animated
 * @flow
 */
'use strict';


var AnimatedImplementation = require('AnimatedImplementation');
var Image = require('Image');
var Text = require('Text');
var View = require('View');

let AnimatedScrollView;

const Animated = {
  View: AnimatedImplementation.createAnimatedComponent(View),
  Text: AnimatedImplementation.createAnimatedComponent(Text),
  Image: AnimatedImplementation.createAnimatedComponent(Image),
  get ScrollView() {
    // Make this lazy to avoid circular reference.
    if (!AnimatedScrollView) {
      AnimatedScrollView = AnimatedImplementation.createAnimatedComponent(require('ScrollView'));
    }
    return AnimatedScrollView;
  },
};

Object.assign((Animated: Object), AnimatedImplementation);

module.exports = ((Animated: any): (typeof AnimatedImplementation) & typeof Animated);
