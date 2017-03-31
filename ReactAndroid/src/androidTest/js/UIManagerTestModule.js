/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule UIManagerTestModule
 */

'use strict';

var BatchedBridge = require('BatchedBridge');
var React = require('React');
var StyleSheet = require('StyleSheet');
var View = require('View');
var Text = require('Text');

var renderApplication = require('renderApplication');

var FlexTestApp = React.createClass({
  _styles: StyleSheet.create({
    container: {
      width: 200,
      height: 200,
      flexDirection: 'row',
    },
    child: {
      flex: 1,
    },
    absolute: {
      position: 'absolute',
      top: 15,
      left: 10,
      width: 50,
      height: 60,
    }
  }),
  render: function() {
    return (
      <View style={this._styles.container} testID="container" collapsable={false}>
        <View style={[this._styles.child, {backgroundColor: '#ff0000'}]} collapsable={false}/>
        <View style={[this._styles.child, {backgroundColor: '#0000ff'}]} collapsable={false}/>
      </View>
    );
  }
});

var FlexWithText = React.createClass({
  _styles: StyleSheet.create({
    container: {
      flexDirection: 'column',
      margin: 20,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      height: 300,
    },
    inner: {
      flex: 1,
      margin: 10,
    },
  }),
  render: function() {
    return (
      <View style={this._styles.container} testID="container" collapsable={false}>
        <View style={this._styles.row} collapsable={false}>
          <Text style={this._styles.inner}>Hello</Text>
          <Text style={this._styles.inner}>World</Text>
        </View>
      </View>
    );
  }
});

var AbsolutePositionTestApp = React.createClass({
  _styles: StyleSheet.create({
    absolute: {
      position: 'absolute',
      top: 15,
      left: 10,
      width: 50,
      height: 60,
    }
  }),
  render: function() {
    return <View style={this._styles.absolute} testID="absolute" collapsable={false}/>;
  }
});

var AbsolutePositionBottomRightTestApp = React.createClass({
  _styles: StyleSheet.create({
    container: {
      width: 100,
      height: 100,
    },
    absolute: {
      position: 'absolute',
      bottom: 15,
      right: 10,
      width: 50,
      height: 60,
    }
  }),
  render: function() {
    return (
      <View style={this._styles.container} testID="container" collapsable={false}>
        <View style={this._styles.absolute} collapsable={false}/>
      </View>
    );
  }
});

var CenteredTextView = React.createClass({
  _styles: StyleSheet.create({
    parent: {
      width: 200,
      height: 100,
      backgroundColor: '#aa3311',
      justifyContent: 'center',
      alignItems: 'center',
    },
    text: {
      fontSize: 15,
      color: '#672831',
    },
  }),
  render: function() {
    return (
      <View collapsable={false}>
        <View style={this._styles.parent} collapsable={false}>
          <Text style={this._styles.text} testID="text">{this.props.text}</Text>
        </View>
      </View>
    );
  }
});

var flushUpdatePositionInList = null;
var UpdatePositionInListTestApp = React.createClass({
  _styles: StyleSheet.create({
    element: {
      height: 10,
    },
    active: {
      height: 50,
    }
  }),
  getInitialState: function() {
    flushUpdatePositionInList = () => this.setState({ active: true });
    return { active: false };
  },
  render: function() {
    return (
      <View collapsable={false} testID="container">
        <View style={this._styles.element} collapsable={false} />
        <View
          style={[
            this._styles.element,
            this.state.active && this._styles.active,
          ]}
          collapsable={false}
        />
        <View style={this._styles.element} collapsable={false}/>
      </View>
    );
  }
});

var UIManagerTestModule = {
  renderFlexTestApplication: function(rootTag) {
    renderApplication(FlexTestApp, {}, rootTag);
  },
  renderFlexWithTextApplication: function(rootTag) {
    renderApplication(FlexWithText, {}, rootTag);
  },
  renderAbsolutePositionBottomRightTestApplication: function(rootTag) {
    renderApplication(AbsolutePositionBottomRightTestApp, {}, rootTag);
  },
  renderAbsolutePositionTestApplication: function(rootTag) {
    renderApplication(AbsolutePositionTestApp, {}, rootTag);
  },
  renderCenteredTextViewTestApplication: function(rootTag, text) {
    renderApplication(CenteredTextView, {text: text}, rootTag);
  },
  renderUpdatePositionInListTestApplication: function(rootTag) {
    renderApplication(UpdatePositionInListTestApp, {}, rootTag);
  },
  flushUpdatePositionInList: function() {
    flushUpdatePositionInList();
  }
};

BatchedBridge.registerCallableModule(
  'UIManagerTestModule',
  UIManagerTestModule
);

module.exports = UIManagerTestModule;
