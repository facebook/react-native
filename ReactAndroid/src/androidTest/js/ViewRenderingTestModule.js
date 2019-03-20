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
const View = require('View');
const StyleSheet = require('StyleSheet');

const renderApplication = require('renderApplication');
class ViewSampleApp extends React.Component {
  state = {};

  render() {
    return <View style={styles.view} collapsable={false} />;
  }
}

let updateMargins;

class MarginSampleApp extends React.Component {
  state = {margin: 10};

  render() {
    updateMargins = this.setState.bind(this, {margin: 15});
    return (
      <View
        style={[{margin: this.state.margin}, styles.marginSample]}
        collapsable={false}
      />
    );
  }
}

class BorderSampleApp extends React.Component {
  render() {
    return (
      <View style={styles.borderSample} collapsable={false}>
        <View style={styles.borderSampleContent} collapsable={false} />
      </View>
    );
  }
}

class TransformSampleApp extends React.Component {
  render() {
    const style = {
      transform: [
        {translateX: 20},
        {translateY: 25},
        {rotate: '15deg'},
        {scaleX: 5},
        {scaleY: 10},
      ],
    };
    return <View style={style} collapsable={false} />;
  }
}

const ViewRenderingTestModule = {
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
  ViewRenderingTestModule,
);

const styles = StyleSheet.create({
  view: {
    opacity: 0.75,
    backgroundColor: 'rgb(255, 0, 0)',
  },
  borderSample: {
    borderLeftWidth: 20,
    borderWidth: 5,
    backgroundColor: 'blue',
  },
  borderSampleContent: {
    backgroundColor: 'red',
    width: 20,
    height: 20,
  },
  marginSample: {
    marginLeft: 20,
  },
});

module.exports = ViewRenderingTestModule;
