/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 */
'use strict';

var React = require('react-native');
var {
  StyleSheet,
  View
} = React;

var styles = StyleSheet.create({
  box: {
    width: 100,
    height: 100,
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
});

exports.title = 'Border';
exports.description = 'View borders';
exports.examples = [
  {
    title: 'Equal-Width / Same-Color',
    description: 'borderWidth & borderColor',
    render() {
      return <View style={[styles.box, styles.border1]} />;
    }
  },
  {
    title: 'Equal-Width / Same-Color',
    description: 'borderWidth & borderColor',
    render() {
      return <View style={[styles.box, styles.borderRadius]} />;
    }
  },
  {
    title: 'Equal-Width Borders',
    description: 'borderWidth & border*Color',
    render() {
      return <View style={[styles.box, styles.border2]} />;
    }
  },
  {
    title: 'Same-Color Borders',
    description: 'border*Width & borderColor',
    render() {
      return <View style={[styles.box, styles.border3]} />;
    }
  },
  {
    title: 'Custom Borders',
    description: 'border*Width & border*Color',
    render() {
      return <View style={[styles.box, styles.border4]} />;
    }
  },
];
