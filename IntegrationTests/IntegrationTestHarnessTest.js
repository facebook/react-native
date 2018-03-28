/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @providesModule IntegrationTestHarnessTest
 */
'use strict';

/* $FlowFixMe(>=0.54.0 site=react_native_oss) This comment suppresses an error
 * found when Flow v0.54 was deployed. To see the error delete this comment and
 * run Flow. */
var requestAnimationFrame = require('fbjs/lib/requestAnimationFrame');
var React = require('react');
var PropTypes = require('prop-types');
var ReactNative = require('react-native');
var {
  Text,
  View,
} = ReactNative;
var { TestModule } = ReactNative.NativeModules;

class IntegrationTestHarnessTest extends React.Component<{
  shouldThrow?: boolean,
  waitOneFrame?: boolean,
}, $FlowFixMeState> {
  static propTypes = {
    shouldThrow: PropTypes.bool,
    waitOneFrame: PropTypes.bool,
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
          {
            /* $FlowFixMe(>=0.54.0 site=react_native_fb,react_native_oss) This
             * comment suppresses an error found when Flow v0.54 was deployed.
             * To see the error delete this comment and run Flow. */
            this.constructor.displayName + ': '}
          {this.state.done ? 'Done' : 'Testing...'}
        </Text>
      </View>
    );
  }
}

IntegrationTestHarnessTest.displayName = 'IntegrationTestHarnessTest';

module.exports = IntegrationTestHarnessTest;
