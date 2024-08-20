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
    cursor: 'pointer',
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

function BoxWithCursor({cursor}) {
  return (
    <View style={{cursor, padding: 10, borderWidth: 1}}>
      <Text style={{fontSize: 11}}>{cursor}</Text>
    </View>
  );
}

function CursorExampleMacOS() {
  const cursors = [
    'auto',
    'alias',
    'all-scroll',
    'cell',
    'col-resize',
    'context-menu',
    'copy',
    'crosshair',
    'default',
    'e-resize',
    'ew-resize',
    'grab',
    'grabbing',
    'help',
    'move',
    'ne-resize',
    'nesw-resize',
    'n-resize',
    'ns-resize',
    'nw-resize',
    'nwse-resize',
    'no-drop',
    'none',
    'not-allowed',
    'pointer',
    'progress',
    'row-resize',
    's-resize',
    'se-resize',
    'sw-resize',
    'text',
    'url',
    'vertical-text',
    'w-resize',
    'wait',
    'zoom-in',
    'zoom-out',
  ];

  return (
    <View style={styles.row}>
      <>
        {cursors.map(cursor => (
          <BoxWithCursor key={cursor} cursor={cursor} />
        ))}
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
    description:
      'macOS supports many more cursors. Unsupported cursors show the system cursor',
    render: CursorExampleMacOS,
  },
  // macOS]
];
