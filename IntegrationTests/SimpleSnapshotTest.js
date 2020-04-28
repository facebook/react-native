/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

const React = require('react');
const ReactNative = require('react-native');

const requestAnimationFrame = require('fbjs/lib/requestAnimationFrame');

const {StyleSheet, View} = ReactNative;
const {TestModule} = ReactNative.NativeModules;

class SimpleSnapshotTest extends React.Component<{}> {
  componentDidMount() {
    if (!TestModule.verifySnapshot) {
      throw new Error('TestModule.verifySnapshot not defined.');
    }
    requestAnimationFrame(() => TestModule.verifySnapshot(this.done));
  }

  done: (success: boolean) => void = (success: boolean) => {
    TestModule.markTestPassed(success);
  };

  render(): React.Node {
    return (
      <View style={styles.container}>
        <View style={styles.box1} />
        <View style={styles.box2} />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    padding: 100,
  },
  box1: {
    width: 80,
    height: 50,
    backgroundColor: 'red',
  },
  box2: {
    top: -10,
    left: 20,
    width: 70,
    height: 90,
    backgroundColor: 'blue',
  },
});

SimpleSnapshotTest.displayName = 'SimpleSnapshotTest';

module.exports = SimpleSnapshotTest;
