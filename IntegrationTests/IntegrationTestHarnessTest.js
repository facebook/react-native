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
const {Text, View, StyleSheet} = ReactNative;
const {TestModule} = ReactNative.NativeModules;

type Props = $ReadOnly<{|
  shouldThrow?: boolean,
  waitOneFrame?: boolean,
|}>;

type State = {|
  done: boolean,
|};

class IntegrationTestHarnessTest extends React.Component<Props, State> {
  state: State = {
    done: false,
  };

  componentDidMount() {
    if (this.props.waitOneFrame) {
      requestAnimationFrame(this.runTest);
    } else {
      this.runTest();
    }
  }

  runTest: () => void = () => {
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

  render(): React.Node {
    return (
      <View style={styles.container}>
        <Text>
          {/* $FlowFixMe(>=0.54.0 site=react_native_fb,react_native_oss) This
           * comment suppresses an error found when Flow v0.54 was deployed.
           * To see the error delete this comment and run Flow. */
          this.constructor.displayName + ': '}
          {this.state.done ? 'Done' : 'Testing...'}
        </Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    padding: 40,
  },
});

IntegrationTestHarnessTest.displayName = 'IntegrationTestHarnessTest';

module.exports = IntegrationTestHarnessTest;
