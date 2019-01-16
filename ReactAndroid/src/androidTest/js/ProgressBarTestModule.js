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
const ReactNative = require('react-native');
const {StyleSheet} = ReactNative;
const ProgressBar = require('ProgressBarAndroid');
const View = require('View');

const renderApplication = require('renderApplication');

class ProgressBarSampleApp extends React.Component {
  state = {};

  render() {
    return (
      <View>
        <ProgressBar styleAttr="Horizontal" testID="Horizontal" />
        <ProgressBar styleAttr="Small" testID="Small" />
        <ProgressBar styleAttr="Large" testID="Large" />
        <ProgressBar styleAttr="Normal" testID="Normal" />
        <ProgressBar styleAttr="Inverse" testID="Inverse" />
        <ProgressBar styleAttr="SmallInverse" testID="SmallInverse" />
        <ProgressBar styleAttr="LargeInverse" testID="LargeInverse" />
        <View style={styles.wrapper}>
          <ProgressBar styleAttr="Horizontal" testID="Horizontal200" />
        </View>
      </View>
    );
  }
}

const ProgressBarTestModule = {
  renderProgressBarApplication: function(rootTag) {
    renderApplication(ProgressBarSampleApp, {}, rootTag);
  },
};

BatchedBridge.registerCallableModule(
  'ProgressBarTestModule',
  ProgressBarTestModule,
);

const styles = StyleSheet.create({
  wrapper: {
    width: 200,
  },
});

module.exports = ProgressBarTestModule;
