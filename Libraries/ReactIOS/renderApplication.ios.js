/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule renderApplication
 */
'use strict';

var Inspector = require('Inspector');
var RCTDeviceEventEmitter = require('RCTDeviceEventEmitter');
var React = require('React');
var StyleSheet = require('StyleSheet');
var Subscribable = require('Subscribable');
var View = require('View');
var WarningBox = require('WarningBox');

var invariant = require('invariant');

var AppContainer = React.createClass({
  mixins: [Subscribable.Mixin],

  getInitialState: function() {
    return { inspector: null };
  },

  toggleElementInspector: function() {
    var inspector = this.state.inspector
      ? null
      : <Inspector
          rootTag={this.props.rootTag}
          inspectedViewTag={React.findNodeHandle(this.refs.main)}
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
    var shouldRenderWarningBox = __DEV__ && console.yellowBoxEnabled;
    var warningBox = shouldRenderWarningBox ? <WarningBox /> : null;
    return (
      <View style={styles.appContainer}>
        <View collapsible={false} style={styles.appContainer} ref="main">
          {this.props.children}
        </View>
        {warningBox}
        {this.state.inspector}
      </View>
    );
  }
});

function renderApplication<D, P, S>(
  RootComponent: ReactClass<D, P, S>,
  initialProps: P,
  rootTag: any
) {
  invariant(
    rootTag,
    'Expect to have a valid rootTag, instead got ', rootTag
  );
  // not when debugging in chrome
  if (__DEV__ && !window.document) {
    var setupDevtools = require('setupDevtools');
    setupDevtools();
  }
  React.render(
    <AppContainer rootTag={rootTag}>
      <RootComponent
        {...initialProps}
        rootTag={rootTag}
      />
    </AppContainer>,
    rootTag
  );
}

var styles = StyleSheet.create({
  appContainer: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
  },
});

module.exports = renderApplication;
