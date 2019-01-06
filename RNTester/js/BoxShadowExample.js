/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

const React = require('react');
const ReactNative = require('react-native');
const {Image, StyleSheet, View} = ReactNative;

const styles = StyleSheet.create({
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
  shadowShaped: {
    borderRadius: 50,
  },
  shadowImage: {
    borderWidth: 0,
    overflow: 'visible',
  },
  shadowChild: {
    backgroundColor: 'transparent',
  },
  shadowChildBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    margin: 8,
    backgroundColor: 'red',
  },
});

exports.title = 'Box Shadow';
exports.description =
  'Demonstrates some of the shadow styles available to Views.';
exports.examples = [
  {
    title: 'Basic shadow',
    description: 'shadowOpacity: 0.5, shadowOffset: {2, 2}',
    render() {
      return <View style={[styles.box, styles.shadow1]} />;
    },
  },
  {
    title: 'Colored shadow',
    description: "shadowColor: 'red', shadowRadius: 0",
    render() {
      return <View style={[styles.box, styles.shadow2]} />;
    },
  },
  {
    title: 'Shaped shadow',
    description: 'borderRadius: 50',
    render() {
      return <View style={[styles.box, styles.shadow1, styles.shadowShaped]} />;
    },
  },
  {
    title: 'Image shadow',
    description: 'Image shadows are derived exactly from the pixels.',
    render() {
      return (
        <Image
          source={require('./hawk.png')}
          style={[styles.box, styles.shadow1, styles.shadowImage]}
        />
      );
    },
  },
  {
    title: 'Child shadow',
    description:
      'For views without an opaque background color, shadow will be derived from the subviews.',
    render() {
      return (
        <View style={[styles.box, styles.shadow1, styles.shadowChild]}>
          <View style={[styles.box, styles.shadowChildBox]} />
        </View>
      );
    },
  },
];
