/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ProgressBarTestModule
 */

"use strict";

var BatchedBridge = require('BatchedBridge');
var React = require('React');
var ProgressBar = require('ProgressBarAndroid');
var View = require('View');

var renderApplication = require('renderApplication');

class ProgressBarSampleApp extends React.Component {
  state = {};

  render() {
    return (
      <View>
        <ProgressBar styleAttr="Horizontal" testID="Horizontal"/>
        <ProgressBar styleAttr="Small" testID="Small"/>
        <ProgressBar styleAttr="Large" testID="Large"/>
        <ProgressBar styleAttr="Normal" testID="Normal"/>
        <ProgressBar styleAttr="Inverse" testID="Inverse"/>
        <ProgressBar styleAttr="SmallInverse" testID="SmallInverse"/>
        <ProgressBar styleAttr="LargeInverse" testID="LargeInverse"/>
        <View style={{width:200}}>
          <ProgressBar styleAttr="Horizontal" testID="Horizontal200" />
        </View>
      </View>
    );
  }
}

var ProgressBarTestModule = {
  renderProgressBarApplication: function(rootTag) {
    renderApplication(ProgressBarSampleApp, {}, rootTag);
  },
};

BatchedBridge.registerCallableModule(
  'ProgressBarTestModule',
  ProgressBarTestModule
);

module.exports = ProgressBarTestModule;
