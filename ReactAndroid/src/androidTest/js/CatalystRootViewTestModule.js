/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

const BatchedBridge = require('BatchedBridge');
const React = require('React');
const Recording = require('NativeModules').Recording;
const StyleSheet = require('StyleSheet');
const View = require('View');

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
  setHeight: function(height) {
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
