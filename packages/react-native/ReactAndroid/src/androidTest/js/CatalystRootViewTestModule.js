/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

const React = require('react');
const {NativeModules, StyleSheet, View} = require('react-native');
const BatchedBridge = require('react-native/Libraries/BatchedBridge/BatchedBridge');

const {Recording} = NativeModules;

let that;

class CatalystRootViewTestApp extends React.Component {
  state = {
    height: 300,
  };

  componentDidMount() {
    that = this;
  }

  componentWillUnmount() {
    Recording.record('RootComponentWillUnmount');
  }

  render() {
    return (
      <View
        collapsable={false}
        style={[styles.container, {height: this.state.height}]}
      />
    );
  }
}

const ReactRootViewTestModule = {
  setHeight: function (height) {
    that.setState({height: height});
  },
};

const styles = StyleSheet.create({
  container: {
    alignSelf: 'stretch',
  },
});

BatchedBridge.registerCallableModule(
  'ReactRootViewTestModule',
  ReactRootViewTestModule,
);

module.exports = {
  CatalystRootViewTestApp: CatalystRootViewTestApp,
};
