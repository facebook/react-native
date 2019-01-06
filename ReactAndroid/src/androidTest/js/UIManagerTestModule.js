/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

const BatchedBridge = require('BatchedBridge');
const React = require('React');
const StyleSheet = require('StyleSheet');
const View = require('View');
const Text = require('Text');

const renderApplication = require('renderApplication');

type FlexTestAppProps = $ReadOnly<{||}>;
class FlexTestApp extends React.Component<FlexTestAppProps> {
  render() {
    return (
      <View
        style={FlexTestAppStyles.container}
        testID="container"
        collapsable={false}>
        <View
          style={[FlexTestAppStyles.child, FlexTestAppStyles.bgRed]}
          collapsable={false}
        />
        <View
          style={[FlexTestAppStyles.child, FlexTestAppStyles.bgBlue]}
          collapsable={false}
        />
      </View>
    );
  }
}

const FlexTestAppStyles = StyleSheet.create({
  container: {
    width: 200,
    height: 200,
    flexDirection: 'row',
  },
  child: {
    flex: 1,
  },
  bgRed: {
    backgroundColor: '#ff0000',
  },
  bgBlue: {
    backgroundColor: '#0000ff',
  },
});

type FlexWithTextProps = $ReadOnly<{||}>;
class FlexWithText extends React.Component<FlexWithTextProps> {
  render() {
    return (
      <View
        style={FlexWithTextStyles.container}
        testID="container"
        collapsable={false}>
        <View style={FlexWithTextStyles.row} collapsable={false}>
          <Text style={FlexWithTextStyles.inner}>Hello</Text>
          <Text style={FlexWithTextStyles.inner}>World</Text>
        </View>
      </View>
    );
  }
}

const FlexWithTextStyles = StyleSheet.create({
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
});

type AbsolutePositionTestAppProps = $ReadOnly<{||}>;
class AbsolutePositionTestApp extends React.Component<
  AbsolutePositionTestAppProps,
> {
  render() {
    return (
      <View
        style={AbsolutePositionTestAppStyles.absolute}
        testID="absolute"
        collapsable={false}
      />
    );
  }
}

const AbsolutePositionTestAppStyles = StyleSheet.create({
  absolute: {
    position: 'absolute',
    top: 15,
    left: 10,
    width: 50,
    height: 60,
  },
});

type AbsolutePositionBottomRightTestAppProps = $ReadOnly<{||}>;
class AbsolutePositionBottomRightTestApp extends React.Component<
  AbsolutePositionBottomRightTestAppProps,
> {
  render() {
    return (
      <View
        style={AbsolutePositionBottomRightTestAppStyles.container}
        testID="container"
        collapsable={false}>
        <View
          style={AbsolutePositionBottomRightTestAppStyles.absolute}
          collapsable={false}
        />
      </View>
    );
  }
}

const AbsolutePositionBottomRightTestAppStyles = StyleSheet.create({
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
});

type CenteredTextViewProps = $ReadOnly<{|
  text?: ?string,
|}>;
class CenteredTextView extends React.Component<CenteredTextViewProps> {
  render() {
    return (
      <View collapsable={false}>
        <View style={CenteredTextViewStyles.parent} collapsable={false}>
          <Text style={CenteredTextViewStyles.text} testID="text">
            {this.props.text}
          </Text>
        </View>
      </View>
    );
  }
}

const CenteredTextViewStyles = StyleSheet.create({
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
});

let flushUpdatePositionInList = null;

type UpdatePositionInListTestAppProps = $ReadOnly<{||}>;
type UpdatePositionInListTestAppState = {|
  active: boolean,
|};
class UpdatePositionInListTestApp extends React.Component<
  UpdatePositionInListTestAppProps,
  UpdatePositionInListTestAppState,
> {
  state = {
    active: false,
  };

  constructor(...args) {
    super(...args);
    flushUpdatePositionInList = () => this.setState({active: true});
  }

  render() {
    return (
      <View collapsable={false} testID="container">
        <View
          style={UpdatePositionInListTestAppStyles.element}
          collapsable={false}
        />
        <View
          style={[
            UpdatePositionInListTestAppStyles.element,
            this.state.active && UpdatePositionInListTestAppStyles.active,
          ]}
          collapsable={false}
        />
        <View
          style={UpdatePositionInListTestAppStyles.element}
          collapsable={false}
        />
      </View>
    );
  }
}

const UpdatePositionInListTestAppStyles = StyleSheet.create({
  element: {
    height: 10,
  },
  active: {
    height: 50,
  },
});

/**
 * This is a workaround for the following flow problem:
 *
 *   const emptyObject: {||} = {}; // Raises error
 *
 * @see https://github.com/facebook/flow/issues/2977
 */
const emptyExactProps = Object.freeze({});

const UIManagerTestModule = {
  renderFlexTestApplication(rootTag: number) {
    renderApplication(FlexTestApp, emptyExactProps, rootTag);
  },
  renderFlexWithTextApplication(rootTag: number) {
    renderApplication(FlexWithText, emptyExactProps, rootTag);
  },
  renderAbsolutePositionBottomRightTestApplication(rootTag: number) {
    renderApplication(
      AbsolutePositionBottomRightTestApp,
      emptyExactProps,
      rootTag,
    );
  },
  renderAbsolutePositionTestApplication(rootTag: number) {
    renderApplication(AbsolutePositionTestApp, emptyExactProps, rootTag);
  },
  renderCenteredTextViewTestApplication(rootTag: number, text: string) {
    renderApplication(CenteredTextView, {text: text}, rootTag);
  },
  renderUpdatePositionInListTestApplication(rootTag: number) {
    renderApplication(UpdatePositionInListTestApp, emptyExactProps, rootTag);
  },
  flushUpdatePositionInList,
};

BatchedBridge.registerCallableModule(
  'UIManagerTestModule',
  UIManagerTestModule,
);

module.exports = UIManagerTestModule;
