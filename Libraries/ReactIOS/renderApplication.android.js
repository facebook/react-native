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
var Portal = require('Portal');
var RCTDeviceEventEmitter = require('RCTDeviceEventEmitter');
var React = require('React');
var ReactNative = require('ReactNative');
var StyleSheet = require('StyleSheet');
var Subscribable = require('Subscribable');
var View = require('View');

var invariant = require('fbjs/lib/invariant');

var YellowBox = __DEV__ ? require('YellowBox') : null;

// require BackAndroid so it sets the default handler that exits the app if no listeners respond
require('BackAndroid');

var AppContainer = React.createClass({
  mixins: [Subscribable.Mixin],

  getInitialState: function() {
    return {
      inspectorVisible: false,
      rootNodeHandle: null,
      rootImportanceForAccessibility: 'auto',
      mainKey: 1,
    };
  },

  toggleElementInspector: function() {
    this.setState({
      inspectorVisible: !this.state.inspectorVisible,
      rootNodeHandle: ReactNative.findNodeHandle(this.refs.main),
    });
  },

  componentDidMount: function() {
    this.addListenerOn(
      RCTDeviceEventEmitter,
      'toggleElementInspector',
      this.toggleElementInspector
    );

    this._unmounted = false;
  },

  renderInspector: function() {
    return this.state.inspectorVisible ?
      <Inspector
        rootTag={this.props.rootTag}
        inspectedViewTag={this.state.rootNodeHandle}
        onRequestRerenderApp={(updateInspectedViewTag) => {
          this.setState(
            (s) => ({mainKey: s.mainKey + 1}),
            () => updateInspectedViewTag(ReactNative.findNodeHandle(this.refs.main))
          );
        }}
      /> :
      null;
  },

  componentWillUnmount: function() {
    this._unmounted = true;
  },

  setRootAccessibility: function(modalVisible) {
    if (this._unmounted) {
      return;
    }

    this.setState({
      rootImportanceForAccessibility: modalVisible ? 'no-hide-descendants' : 'auto',
    });
  },

  render: function() {
    var RootComponent = this.props.rootComponent;
    var appView =
      <View
        ref="main"
        key={this.state.mainKey}
        collapsable={!this.state.inspectorVisible}
        style={styles.appContainer}>
        <RootComponent
          {...this.props.initialProps}
          rootTag={this.props.rootTag}
          importantForAccessibility={this.state.rootImportanceForAccessibility}/>
        <Portal
          onModalVisibilityChanged={this.setRootAccessibility}/>
      </View>;
    return __DEV__ ?
      <View style={styles.appContainer}>
        {appView}
        <YellowBox />
        {this.renderInspector()}
      </View> :
      appView;
  }
});

function renderApplication<D, P, S>(
  RootComponent: ReactClass<P>,
  initialProps: P,
  rootTag: any
) {
  invariant(
    rootTag,
    'Expect to have a valid rootTag, instead got ', rootTag
  );
  ReactNative.render(
    <AppContainer
      rootComponent={RootComponent}
      initialProps={initialProps}
      rootTag={rootTag} />,
    rootTag
  );
}

var styles = StyleSheet.create({
  // This is needed so the application covers the whole screen
  // and therefore the contents of the Portal are not clipped.
  appContainer: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
  },
});

module.exports = renderApplication;
