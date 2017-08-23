/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 * @providesModule SyncMethodTest
 */
'use strict';

var React = require('react');
var ReactNative = require('react-native');
var { View } = ReactNative;

const {
  TestModule,
  RNTesterTestModule,
} = ReactNative.NativeModules;


class SyncMethodTest extends React.Component<{}> {
  componentDidMount() {
    if (RNTesterTestModule.echoString('test string value') !== 'test string value') {
      throw new Error('Something wrong with sync method export');
    }
    if (RNTesterTestModule.methodThatReturnsNil() != null) {
      throw new Error('Something wrong with sync method export');
    }
    TestModule.markTestCompleted();
  }

  render(): React.Node {
    return <View />;
  }
}

SyncMethodTest.displayName = 'SyncMethodTest';

module.exports = SyncMethodTest;
