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
const {StyleSheet, View} = require('react-native');

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
  },
  box: {
    width: 100,
    height: 100,
    backgroundColor: 'white',
    marginRight: 10,
  },
  elevation1: {
    elevation: 1,
  },
  elevation2: {
    elevation: 3,
  },
  elevation3: {
    elevation: 10,
  },
  shadowColor1: {
    shadowColor: 'red',
  },
  shadowColor2: {
    shadowColor: 'blue',
  },
  shadowColor3: {
    shadowColor: '#00FF0080',
  },
  shadowShaped: {
    borderRadius: 50,
  },
  border: {
    borderWidth: 5,
    borderColor: '#EEE',
  },
});

exports.title = 'Box Shadow';
exports.description =
  'Demonstrates some of the shadow styles available to Views.';
exports.examples = [
  {
    title: 'Basic elevation',
    description: 'elevation: 1, 3, 6',
    render() {
      return (
        <View style={styles.wrapper}>
          <View style={[styles.box, styles.elevation1]} />
          <View style={[styles.box, styles.elevation2]} />
          <View style={[styles.box, styles.elevation3]} />
        </View>
      );
    },
  },
  {
    title: 'Fractional elevation',
    description: 'elevation: 0.1, 0.5, 1.5',
    render() {
      return (
        <View style={styles.wrapper}>
          <View style={[styles.box, {elevation: 0.1}]} />
          <View style={[styles.box, {elevation: 0.5}]} />
          <View style={[styles.box, {elevation: 1.5}]} />
        </View>
      );
    },
  },
  {
    title: 'Colored shadow',
    description: "shadowColor: 'red', 'blue', '#00FF0080'",
    render() {
      return (
        <View style={styles.wrapper}>
          <View style={[styles.box, styles.elevation1, styles.shadowColor1]} />
          <View style={[styles.box, styles.elevation2, styles.shadowColor2]} />
          <View style={[styles.box, styles.elevation3, styles.shadowColor3]} />
        </View>
      );
    },
  },
  {
    title: 'Shaped shadow',
    description: 'borderRadius: 50',
    render() {
      return (
        <View style={styles.wrapper}>
          <View style={[styles.box, styles.elevation1, styles.shadowShaped]} />
          <View style={[styles.box, styles.elevation2, styles.shadowShaped]} />
          <View style={[styles.box, styles.elevation3, styles.shadowShaped]} />
        </View>
      );
    },
  },
  {
    title: 'Borders',
    description: 'borderWidth: 5',
    render() {
      return (
        <View style={styles.wrapper}>
          <View style={[styles.box, styles.elevation1, styles.border]} />
          <View style={[styles.box, styles.elevation2, styles.border]} />
          <View style={[styles.box, styles.elevation3, styles.border]} />
        </View>
      );
    },
  },
];
