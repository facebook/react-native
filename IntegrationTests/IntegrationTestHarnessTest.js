/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 * @providesModule IntegrationTestHarnessTest
 */
'use strict';

var requestAnimationFrame = require('fbjs/lib/requestAnimationFrame');
var React = require('react');
var ReactNative = require('react-native');
var {
  Text,
  View,
} = ReactNative;
var { TestModule } = ReactNative.NativeModules;

class IntegrationTestHarnessTest extends React.Component {
  props: {
    shouldThrow?: boolean,
    waitOneFrame?: boolean,
  };

  static propTypes = {
    shouldThrow: React.PropTypes.bool,
    waitOneFrame: React.PropTypes.bool,
  };

  state = {
    done: false,
  };

  componentDidMount() {
    if (this.props.waitOneFrame) {
      requestAnimationFrame(this.runTest);
    } else {
      this.runTest();
    }
  }

  runTest = () => {
    if (this.props.shouldThrow) {
      throw new Error('Throwing error because shouldThrow');
    }
    if (!TestModule) {
      throw new Error('RCTTestModule is not registered.');
    } else if (!TestModule.markTestCompleted) {
      throw new Error('RCTTestModule.markTestCompleted not defined.');
    }
    this.setState({done: true}, () => {
      TestModule.markTestCompleted();
    });
  };

  render() {
    return (
      <View style={{backgroundColor: 'white', padding: 40}}>
        <Text>
          {this.constructor.displayName + ': '}
          {this.state.done ? 'Done' : 'Testing...'}
        </Text>
      </View>
    );
  }
}

IntegrationTestHarnessTest.displayName = 'IntegrationTestHarnessTest';

module.exports = IntegrationTestHarnessTest;
