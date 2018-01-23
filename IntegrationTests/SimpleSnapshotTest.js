/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 * @providesModule SimpleSnapshotTest
 */
'use strict';

var React = require('react');
var ReactNative = require('react-native');
/* $FlowFixMe(>=0.54.0 site=react_native_oss) This comment suppresses an error
 * found when Flow v0.54 was deployed. To see the error delete this comment and
 * run Flow. */
var requestAnimationFrame = require('fbjs/lib/requestAnimationFrame');

var {
  StyleSheet,
  View,
} = ReactNative;
var { TestModule } = ReactNative.NativeModules;

class SimpleSnapshotTest extends React.Component<{}> {
  componentDidMount() {
    if (!TestModule.verifySnapshot) {
      throw new Error('TestModule.verifySnapshot not defined.');
    }
    requestAnimationFrame(() => TestModule.verifySnapshot(this.done));
  }

  done = (success : boolean) => {
    TestModule.markTestPassed(success);
  };

  render() {
    return (
      <View style={{backgroundColor: 'white', padding: 100}}>
        <View style={styles.box1} />
        <View style={styles.box2} />
      </View>
    );
  }
}

var styles = StyleSheet.create({
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
