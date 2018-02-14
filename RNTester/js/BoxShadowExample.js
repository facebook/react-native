/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule BoxShadowExample
 */
'use strict';

var React = require('react');
var ReactNative = require('react-native');
var {
  Image,
  StyleSheet,
  View
} = ReactNative;

var styles = StyleSheet.create({
  box: {
    width: 100,
    height: 100,
    borderWidth: 2,
  },
  shadow1: {
    shadowOpacity: 0.5,
    shadowRadius: 3,
    shadowOffset: {width: 2, height: 2},
  },
  shadow2: {
    shadowOpacity: 1.0,
    shadowColor: 'red',
    shadowRadius: 0,
    shadowOffset: {width: 3, height: 3},
  },
});

exports.title = 'Box Shadow';
exports.description = 'Demonstrates some of the shadow styles available to Views.';
exports.examples = [
  {
    title: 'Basic shadow',
    description: 'shadowOpacity: 0.5, shadowOffset: {2, 2}',
    render() {
      return <View style={[styles.box, styles.shadow1]} />;
    }
  },
  {
    title: 'Colored shadow',
    description: 'shadowColor: \'red\', shadowRadius: 0',
    render() {
      return <View style={[styles.box, styles.shadow2]} />;
    }
  },
  {
    title: 'Shaped shadow',
    description: 'borderRadius: 50',
    render() {
      return <View style={[styles.box, styles.shadow1, {borderRadius: 50}]} />;
    }
  },
  {
    title: 'Image shadow',
    description: 'Image shadows are derived exactly from the pixels.',
    render() {
      return <Image
        source={require('./hawk.png')}
        style={[styles.box, styles.shadow1, {borderWidth: 0, overflow: 'visible'}]}
      />;
    }
  },
  {
    title: 'Child shadow',
    description: 'For views without an opaque background color, shadow will be derived from the subviews.',
    render() {
      return <View style={[styles.box, styles.shadow1, {backgroundColor: 'transparent'}]}>
        <View style={[styles.box, {width: 80, height: 80, borderRadius: 40, margin: 8, backgroundColor: 'red'}]}/>
      </View>;
    }
  },
];
