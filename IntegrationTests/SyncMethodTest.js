/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

'use strict';

const React = require('react');
const ReactNative = require('react-native');
const {View} = ReactNative;

const {TestModule, RNTesterTestModule} = ReactNative.NativeModules;

class SyncMethodTest extends React.Component<{}> {
  componentDidMount() {
    if (
      RNTesterTestModule.echoString('test string value') !== 'test string value'
    ) {
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
