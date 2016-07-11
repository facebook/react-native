/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ViewRenderingTestModule
 */

"use strict";

var BatchedBridge = require('BatchedBridge');
var React = require('React');
var View = require('View');
var StyleSheet = require('StyleSheet');

var renderApplication = require('renderApplication');

var styles = StyleSheet.create({
  view: {
    opacity: 0.75,
    backgroundColor: "rgb(255, 0, 0)",
  },
});

var ViewSampleApp = React.createClass({
  render: function() {
    return (
      <View style={styles.view} collapsable={false}/>
    );
  },
  getInitialState: function() {
    return {};
  },
});

var updateMargins;
var MarginSampleApp = React.createClass({
  getInitialState: function() {
    return {margin: 10};
  },
  render: function() {
    updateMargins = this.setState.bind(this, {margin: 15});
    return (
      <View style={{margin: this.state.margin, marginLeft: 20}} collapsable={false}/>
    )
  },
});

var BorderSampleApp = React.createClass({
  render: function() {
    return (
      <View style={{borderLeftWidth: 20, borderWidth: 5, backgroundColor: 'blue'}} collapsable={false}>
        <View style={{backgroundColor: 'red', width: 20, height: 20}} collapsable={false}/>
      </View>
    );
  }
});

var TransformSampleApp = React.createClass({
  render: function() {
    var style = {
      transform: [
        {translateX: 20},
        {translateY: 25},
        {rotate: '15deg'},
        {scaleX: 5},
        {scaleY: 10},
      ]
    };
    return (
      <View style={style} collapsable={false}/>
    );
  }
});

var ViewRenderingTestModule = {
  renderViewApplication: function(rootTag) {
    renderApplication(ViewSampleApp, {}, rootTag);
  },
  renderMarginApplication: function(rootTag) {
    renderApplication(MarginSampleApp, {}, rootTag);
  },
  renderBorderApplication: function(rootTag) {
    renderApplication(BorderSampleApp, {}, rootTag);
  },
  renderTransformApplication: function(rootTag) {
    renderApplication(TransformSampleApp, {}, rootTag);
  },
  updateMargins: function() {
    updateMargins();
  },
};

BatchedBridge.registerCallableModule(
  'ViewRenderingTestModule',
  ViewRenderingTestModule
);

module.exports = ViewRenderingTestModule;
