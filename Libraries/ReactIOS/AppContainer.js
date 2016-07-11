/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule AppContainer
 * @noflow
 */

'use strict';

var RCTDeviceEventEmitter = require('RCTDeviceEventEmitter');
var React = require('React');
var ReactNative = require('ReactNative');
var Subscribable = require('Subscribable');
var StyleSheet = require('StyleSheet');
var View = require('View');

var Inspector = __DEV__ ? require('Inspector') : null;
var YellowBox = __DEV__ ? require('YellowBox') : null;

var AppContainer = React.createClass({
  mixins: [Subscribable.Mixin],

  getInitialState: function() {
    return { inspector: null, mainKey: 1 };
  },

  toggleElementInspector: function() {
    var inspector = !__DEV__ || this.state.inspector
      ? null
      : <Inspector
          inspectedViewTag={ReactNative.findNodeHandle(this.refs.main)}
          onRequestRerenderApp={(updateInspectedViewTag) => {
            this.setState(
              (s) => ({mainKey: s.mainKey + 1}),
              () => updateInspectedViewTag(ReactNative.findNodeHandle(this.refs.main))
            );
          }}
        />;
    this.setState({inspector});
  },

  componentDidMount: function() {
    this.addListenerOn(
      RCTDeviceEventEmitter,
      'toggleElementInspector',
      this.toggleElementInspector
    );
  },

  render: function() {
    let yellowBox = null;
    if (__DEV__) {
      yellowBox = <YellowBox />;
    }
    return (
      <View style={styles.appContainer}>
        <View
          collapsable={!this.state.inspector}
          key={this.state.mainKey}
          style={styles.appContainer} ref="main">
          {this.props.children}
        </View>
        {yellowBox}
        {this.state.inspector}
      </View>
    );
  }
});

var styles = StyleSheet.create({
  appContainer: {
    flex: 1,
  },
});

module.exports = AppContainer;
