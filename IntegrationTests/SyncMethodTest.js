/**
 * Copyright (c) Facebook, Inc. and its affiliates.
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

class SyncMethodTest extends React.Component<{...}> {
  componentDidMount() {
    if (
      RNTesterTestModule.echoString('test string value') !== 'test string value'
    ) {
      throw new Error('Something wrong with echoString sync method');
    }
    if (RNTesterTestModule.methodThatReturnsNil() != null) {
      throw new Error('Something wrong with methodThatReturnsNil sync method');
    }
    let response;
    RNTesterTestModule.methodThatCallsCallbackWithString('test', echo => {
      response = echo;
    });
    requestAnimationFrame(() => {
      if (response === 'test') {
        TestModule.markTestCompleted();
      } else {
        throw new Error(
          'Something wrong with methodThatCallsCallbackWithString sync method, ' +
            'got response ' +
            JSON.stringify(response),
        );
      }
    });
  }

  render(): React.Node {
    return <View />;
  }
}

SyncMethodTest.displayName = 'SyncMethodTest';

module.exports = SyncMethodTest;
