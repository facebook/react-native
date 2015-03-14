/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 */
'use strict';

var RCTTestModule = require('NativeModules').RCTTestModule;
var React = require('react-native');
var {
  Text,
  View,
} = React;

var IntegrationTestHarnessTest = React.createClass({
  propTypes: {
    shouldThrow: React.PropTypes.bool,
    waitOneFrame: React.PropTypes.bool,
  },

  getInitialState() {
    return {
      done: false,
    };
  },

  componentDidMount() {
    if (this.props.waitOneFrame) {
      requestAnimationFrame(this.runTest);
    } else {
      this.runTest();
    }
  },

  runTest() {
    if (this.props.shouldThrow) {
      throw new Error('Throwing error because shouldThrow');
    }
    if (!RCTTestModule) {
      throw new Error('RCTTestModule is not registered.');
    } else if (!RCTTestModule.markTestCompleted) {
      throw new Error('RCTTestModule.markTestCompleted not defined.');
    }
    this.setState({done: true}, RCTTestModule.markTestCompleted);
  },

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
});

module.exports = IntegrationTestHarnessTest;
