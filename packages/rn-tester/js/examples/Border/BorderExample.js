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
  box: {
    width: 100,
    height: 100,
  },
  wrapper: {
    flexDirection: 'row',
  },
  border1: {
    borderWidth: 10,
    borderColor: 'brown',
  },
  borderRadius: {
    borderWidth: 10,
    borderRadius: 10,
    borderColor: 'cyan',
  },
  border2: {
    borderWidth: 10,
    borderTopColor: 'red',
    borderRightColor: 'yellow',
    borderBottomColor: 'green',
    borderLeftColor: 'blue',
  },
  border3: {
    borderColor: 'purple',
    borderTopWidth: 10,
    borderRightWidth: 20,
    borderBottomWidth: 30,
    borderLeftWidth: 40,
  },
  border4: {
    borderTopWidth: 10,
    borderTopColor: 'red',
    borderRightWidth: 20,
    borderRightColor: 'yellow',
    borderBottomWidth: 30,
    borderBottomColor: 'green',
    borderLeftWidth: 40,
    borderLeftColor: 'blue',
  },
  border5: {
    borderRadius: 50,
    borderTopWidth: 10,
    borderTopColor: 'red',
    borderRightWidth: 20,
    borderRightColor: 'yellow',
    borderBottomWidth: 30,
    borderBottomColor: 'green',
    borderLeftWidth: 40,
    borderLeftColor: 'blue',
  },
  border6: {
    borderTopWidth: 10,
    borderTopColor: 'red',
    borderRightWidth: 20,
    borderRightColor: 'yellow',
    borderBottomWidth: 30,
    borderBottomColor: 'green',
    borderLeftWidth: 40,
    borderLeftColor: 'blue',

    borderTopLeftRadius: 100,
  },
  border7: {
    borderWidth: 10,
    borderColor: '#f007',
    borderRadius: 30,
    overflow: 'hidden',
  },
  border7_inner: {
    backgroundColor: 'blue',
    width: 100,
    height: 100,
  },
  border8: {
    width: 60,
    height: 60,
    borderColor: 'black',
    marginRight: 10,
    backgroundColor: 'lightgrey',
  },
  border8Top: {
    borderTopWidth: 5,
  },
  border8Left: {
    borderLeftWidth: 5,
  },
  border8Bottom: {
    borderBottomWidth: 5,
  },
  border8Right: {
    borderRightWidth: 5,
  },
  border9: {
    borderWidth: 10,
    borderTopLeftRadius: 10,
    borderBottomRightRadius: 20,
    borderColor: 'black',
  },
  border10: {
    borderWidth: 10,
    backgroundColor: 'white',
    borderTopLeftRadius: 10,
    borderBottomRightRadius: 20,
    borderColor: 'black',
    elevation: 10,
  },
  border11: {
    width: 0,
    height: 0,
    borderStyle: 'solid',
    overflow: 'hidden',
    borderTopWidth: 50,
    borderRightWidth: 0,
    borderBottomWidth: 50,
    borderLeftWidth: 100,
    borderTopColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: 'red',
  },
  border12: {
    borderStyle: 'solid',
    overflow: 'hidden',
    borderTopWidth: 10,
    borderRightWidth: 20,
    borderBottomWidth: 30,
    borderLeftWidth: 40,
    borderRadius: 20,
  },
  border13: {
    borderStyle: 'solid',
    overflow: 'hidden',
    borderTopWidth: 10,
    borderRightWidth: 20,
    borderBottomWidth: 30,
    borderLeftWidth: 40,
    borderTopColor: 'red',
    borderRightColor: 'green',
    borderBottomColor: 'blue',
    borderLeftColor: 'magenta',
    borderRadius: 20,
  },
  border14: {
    borderStyle: 'solid',
    overflow: 'hidden',
    borderTopWidth: 10,
    borderRightWidth: 20,
    borderBottomWidth: 30,
    borderLeftWidth: 40,
    borderTopColor: 'red',
    borderRightColor: 'green',
    borderBottomColor: 'blue',
    borderLeftColor: 'magenta',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 40,
    borderBottomRightRadius: 30,
    borderBottomLeftRadius: 40,
  },
});

exports.title = 'Border';
exports.description =
  'Demonstrates some of the border styles available to Views.';
exports.examples = [
  {
    title: 'Equal-Width / Same-Color',
    description: 'borderWidth & borderColor',
    render() {
      return <View style={[styles.box, styles.border1]} />;
    },
  },
  {
    title: 'Equal-Width / Same-Color',
    description: 'borderWidth & borderColor & borderRadius',
    render() {
      return <View style={[styles.box, styles.borderRadius]} />;
    },
  },
  {
    title: 'Equal-Width Borders',
    description: 'borderWidth & border*Color',
    render() {
      return <View style={[styles.box, styles.border2]} />;
    },
  },
  {
    title: 'Same-Color Borders',
    description: 'border*Width & borderColor',
    render() {
      return <View style={[styles.box, styles.border3]} />;
    },
  },
  {
    title: 'Custom Borders',
    description: 'border*Width & border*Color',
    render() {
      return <View style={[styles.box, styles.border4]} />;
    },
  },
  {
    title: 'Custom Borders',
    description: 'border*Width & border*Color',
    platform: 'ios',
    render() {
      return <View style={[styles.box, styles.border5]} />;
    },
  },
  {
    title: 'Custom Borders',
    description: 'border*Width & border*Color',
    platform: 'ios',
    render() {
      return <View style={[styles.box, styles.border6]} />;
    },
  },
  {
    title: 'Custom Borders',
    description: 'borderRadius & clipping',
    platform: 'ios',
    render() {
      return (
        <View style={[styles.box, styles.border7]}>
          <View style={styles.border7_inner} />
        </View>
      );
    },
  },
  {
    title: 'Single Borders',
    description: 'top, left, bottom right',
    render() {
      return (
        <View style={styles.wrapper}>
          <View style={[styles.box, styles.border8, styles.border8Top]} />
          <View style={[styles.box, styles.border8, styles.border8Left]} />
          <View style={[styles.box, styles.border8, styles.border8Bottom]} />
          <View style={[styles.box, styles.border8, styles.border8Right]} />
        </View>
      );
    },
  },
  {
    title: 'Corner Radii',
    description: 'borderTopLeftRadius & borderBottomRightRadius',
    render() {
      return <View style={[styles.box, styles.border9]} />;
    },
  },
  {
    title: 'Corner Radii / Elevation',
    description: 'borderTopLeftRadius & borderBottomRightRadius & elevation',
    platform: 'android',
    render() {
      return <View style={[styles.box, styles.border10]} />;
    },
  },
  {
    title: 'CSS Trick - Triangle',
    description: 'create a triangle by manipulating border colors and widths',
    render() {
      return <View style={[styles.border11]} />;
    },
  },
  {
    title: 'Curved border(Left|Right|Bottom|Top)Width',
    description: 'Make a non-uniform width curved border',
    render() {
      return <View style={[styles.box, styles.border12]} />;
    },
  },
  {
    title: 'Curved border(Left|Right|Bottom|Top)Color',
    description: 'Make a non-uniform color curved border',
    render() {
      return <View style={[styles.box, styles.border13]} />;
    },
  },
  {
    title: 'Curved border(Top|Bottom)(Left|Right)Radius',
    description: 'Make a non-uniform radius curved border',
    render() {
      return <View style={[styles.box, styles.border14]} />;
    },
  },
];
