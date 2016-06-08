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

const Inspector = require('Inspector');
const RCTDeviceEventEmitter = require('RCTDeviceEventEmitter');
const React = require('React');
const ReactNative = require('ReactNative');
const StyleSheet = require('StyleSheet');
const Subscribable = require('Subscribable');
const View = require('View');

const invariant = require('fbjs/lib/invariant');

const YellowBox = __DEV__ ? require('YellowBox') : null;

// require BackAndroid so it sets the default handler that exits the app if no listeners respond
require('BackAndroid');

const AppContainer = React.createClass({
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
      rootNodeHandle: ReactNative.findNodeHandle(this._mainRef),
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
            () => updateInspectedViewTag(ReactNative.findNodeHandle(this._mainRef))
          );
        }}
      /> :
      null;
  },

  componentWillUnmount: function() {
    this._unmounted = true;
  },

  _setMainRef: function(ref) {
    this._mainRef = ref;
  },

  render: function() {
    const RootComponent = this.props.rootComponent;
    const appView =
      <View
        ref={this._setMainRef}
        key={this.state.mainKey}
        collapsable={!this.state.inspectorVisible}
        style={StyleSheet.absoluteFill}>
        <RootComponent
          {...this.props.initialProps}
          rootTag={this.props.rootTag}
          importantForAccessibility={this.state.rootImportanceForAccessibility}
        />
      </View>;
    return __DEV__ ?
      <View style={StyleSheet.absoluteFill}>
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
      rootTag={rootTag}
    />,
    rootTag
  );
}

module.exports = renderApplication;
