/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

var BatchedBridge = require('BatchedBridge');
var React = require('React');
var StyleSheet = require('StyleSheet');
var View = require('View');
var Text = require('Text');

var createReactClass = require('create-react-class');
var renderApplication = require('renderApplication');


type FlexTestAppProps = $ReadOnly<{||}>;
class FlexTestApp extends React.Component<FlexTestAppProps> {
  _styles = StyleSheet.create({
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
    },
  })
  render() {
    return (
      <View
        style={this._styles.container}
        testID="container"
        collapsable={false}>
        <View
          style={[this._styles.child, { backgroundColor: '#ff0000' }]}
          collapsable={false}
        />
        <View
          style={[this._styles.child, { backgroundColor: '#0000ff' }]}
          collapsable={false}
        />
      </View>
    );
  }
}

type FlexWithTextProps = $ReadOnly<{||}>;
class FlexWithText extends React.Component<FlexWithTextProps> {
  _styles = StyleSheet.create({
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
  })
  render() {
    return (
      <View
        style={this._styles.container}
        testID="container"
        collapsable={false}>
        <View style={this._styles.row} collapsable={false}>
          <Text style={this._styles.inner}>Hello</Text>
          <Text style={this._styles.inner}>World</Text>
        </View>
      </View>
    );
  }
}

type AbsolutePositionTestAppProps = $ReadOnly<{||}>;
class AbsolutePositionTestApp extends React.Component<AbsolutePositionTestAppProps> {
  _styles = StyleSheet.create({
    absolute: {
      position: 'absolute',
      top: 15,
      left: 10,
      width: 50,
      height: 60,
    },
  })
  render() {
    return (
      <View
        style={this._styles.absolute}
        testID="absolute"
        collapsable={false}
      />
    );
  }
}

type AbsolutePositionBottomRightTestAppProps = $ReadOnly<{||}>;
class AbsolutePositionBottomRightTestApp extends React.Component<AbsolutePositionBottomRightTestAppProps> {
  _styles = StyleSheet.create({
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
    },
  })

  render() {
    return (
      <View
        style={this._styles.container}
        testID="container"
        collapsable={false}>
        <View style={this._styles.absolute} collapsable={false} />
      </View>
    );
  }
}

type CenteredTextViewProps = $ReadOnly<{|
  text?: ?string,
|}>;
class CenteredTextView extends React.Component<CenteredTextViewProps> {
  _styles = StyleSheet.create({
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
  })

  render() {
    return (
      <View collapsable={false}>
        <View style={this._styles.parent} collapsable={false}>
          <Text style={this._styles.text} testID="text">
            {this.props.text}
          </Text>
        </View>
      </View>
    );
  }
}

let flushUpdatePositionInList = null;
type UpdatePositionInListTestAppProps = $ReadOnly<{||}>;
type UpdatePositionInListTestAppState = $ReadOnly<{|
  active?: ?boolean
    |}>;
class UpdatePositionInListTestApp extends React.Component<UpdatePositionInListTestAppProps, UpdatePositionInListTestAppState> {
  state = { active: false }

  _styles = StyleSheet.create({
    element: {
      height: 10,
    },
    active: {
      height: 50,
    },
  })

  flushUpdatePositionInList = () => this.setState({ active: true });

  render() {
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
        <View style={this._styles.element} collapsable={false} />
      </View>
    );
  }
}

const UIManagerTestModule = {
  renderFlexTestApplication = rootTag => {
    renderApplication(FlexTestApp, {}, rootTag);
  },
  renderFlexWithTextApplication = rootTag => {
    renderApplication(FlexWithText, {}, rootTag);
  },
  renderAbsolutePositionBottomRightTestApplication = rootTag => {
    renderApplication(AbsolutePositionBottomRightTestApp, {}, rootTag);
  },
  renderAbsolutePositionTestApplication = rootTag => {
    renderApplication(AbsolutePositionTestApp, {}, rootTag);
  },
  renderCenteredTextViewTestApplication = (rootTag, text) => {
    renderApplication(CenteredTextView, { text: text }, rootTag);
  },
  renderUpdatePositionInListTestApplication = rootTag => {
    renderApplication(UpdatePositionInListTestApp, {}, rootTag);
  },
  flushUpdatePositionInList = () => {
    flushUpdatePositionInList();
  },
};

BatchedBridge.registerCallableModule(
  'UIManagerTestModule',
  UIManagerTestModule,
);

module.exports = UIManagerTestModule;
