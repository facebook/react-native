/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

// [macOS]

const React = require('react');
const {StyleSheet, Text, View} = require('react-native');

const styles = StyleSheet.create({
  invisibleBox: {
    width: 100,
    height: 100,
  },
  box: {
    width: 100,
    height: 100,
    borderWidth: 2,
  },
  circle: {
    width: 100,
    height: 100,
    borderWidth: 2,
    borderRadius: 100,
  },
  halfcircle: {
    width: 100,
    height: 100,
    borderWidth: 2,
    borderTopStartRadius: 100,
    borderBottomStartRadius: 100,
  },
  solid: {
    backgroundColor: 'blue',
  },
  pointer: {
    cursor: 'alias',
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

function CursorExampleAuto() {
  return (
    <View style={styles.row}>
      <View style={styles.box} />
      <View style={styles.circle} />
      <View style={styles.halfcircle} />
      <View style={[styles.box, styles.solid]} />
      <View style={[styles.circle, styles.solid]} />
      <View style={[styles.halfcircle, styles.solid]} />
    </View>
  );
}

function CursorExamplePointer() {
  return (
    <View style={styles.row}>
      <View style={[styles.box, styles.pointer]} />
      <View style={[styles.circle, styles.pointer]} />
      <View style={[styles.halfcircle, styles.pointer]} />
      <View style={[styles.box, styles.solid, styles.pointer]} />
      <View style={[styles.circle, styles.solid, styles.pointer]} />
      <View style={[styles.halfcircle, styles.solid, styles.pointer]} />
    </View>
  );
}

function CursorExamplePointer() {
  return (
    <View style={styles.row}>
      <View style={[styles.box, styles.pointer]} />
      <View style={[styles.circle, styles.pointer]} />
      <View style={[styles.halfcircle, styles.pointer]} />
      <View style={[styles.box, styles.solid, styles.pointer]} />
      <View style={[styles.circle, styles.solid, styles.pointer]} />
      <View style={[styles.halfcircle, styles.solid, styles.pointer]} />
    </View>
  );
}

function CursorExampleViewFlattening() {
  return (
    <View style={styles.row}>
      <View style={[styles.invisibleBox, styles.centerContent, styles.pointer]}>
        <Text>pointer</Text>
      </View>
    </View>
  );
}

// [macOS
function CursorExampleMacOS() {
  return (
    <View style={styles.row}>
      <>
        <View style={{cursor: 'auto', padding: 10}}>
          <Text style={{fontSize: 11}}>auto</Text>
        </View>
        <View style={{cursor: 'default', padding: 10}}>
          <Text style={{fontSize: 11}}>default</Text>
        </View>
        <View style={{cursor: 'context-menu', padding: 10}}>
          <Text style={{fontSize: 11}}>context-menu</Text>
        </View>
        <View style={{cursor: 'pointer', padding: 10}}>
          <Text style={{fontSize: 11}}>pointer</Text>
        </View>
        <View style={{cursor: 'text', padding: 10}}>
          <Text style={{fontSize: 11}}>text</Text>
        </View>
        <View style={{cursor: 'vertical-text', padding: 10}}>
          <Text style={{fontSize: 11}}>vertical-text</Text>
        </View>
        <View style={{cursor: 'alias', padding: 10}}>
          <Text style={{fontSize: 11}}>alias</Text>
        </View>
        <View style={{cursor: 'copy', padding: 10}}>
          <Text style={{fontSize: 11}}>copy</Text>
        </View>
        <View style={{cursor: 'not-allowed', padding: 10}}>
          <Text style={{fontSize: 11}}>not-allowed</Text>
        </View>
        <View style={{cursor: 'grab', padding: 10}}>
          <Text style={{fontSize: 11}}>grab</Text>
        </View>
        <View style={{cursor: 'grabbing', padding: 10}}>
          <Text style={{fontSize: 11}}>grabbing</Text>
        </View>
        <View style={{cursor: 'col-resize', padding: 10}}>
          <Text style={{fontSize: 11}}>col-resize</Text>
        </View>
        <View style={{cursor: 'row-resize', padding: 10}}>
          <Text style={{fontSize: 11}}>row-resize</Text>
        </View>
        <View style={{cursor: 'n-resize', padding: 10}}>
          <Text style={{fontSize: 11}}>n-resize</Text>
        </View>
        <View style={{cursor: 'e-resize', padding: 10}}>
          <Text style={{fontSize: 11}}>e-resize</Text>
        </View>
        <View style={{cursor: 's-resize', padding: 10}}>
          <Text style={{fontSize: 11}}>s-resize</Text>
        </View>
        <View style={{cursor: 'w-resize', padding: 10}}>
          <Text style={{fontSize: 11}}>w-resize</Text>
        </View>
      </>
    </View>
  );
}
// macOS]

exports.title = 'Cursor';
exports.category = 'UI';
exports.description =
  'Demonstrates setting a cursor, which affects the appearance when a pointer is over the View.';
exports.examples = [
  {
    title: 'Default',
    description: "Cursor: 'auto' or no cursor set ",
    render: CursorExampleAuto,
  },
  {
    title: 'Pointer',
    description: 'cursor: pointer',
    render: CursorExamplePointer,
  },
  {
    title: 'Pointer',
    description: 'Views with a cursor do not get flattened',
    render: CursorExampleViewFlattening,
  },
  // [macOS
  {
    title: 'macOS Cursors',
    description: 'macOS supports many more cursors',
    render: CursorExampleMacOS,
  },
  // macOS]
];
