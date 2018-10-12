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
const StyleSheet = require('StyleSheet');
const View = require('View');
const Text = require('Text');

const renderApplication = require('renderApplication');

const FlexTestApp = () => {
  return (
    <View
      style={styles.flexTestApp.container}
      testID="container"
      collapsable={false}>
      <View
        style={[styles.flexTestApp.child, {backgroundColor: '#ff0000'}]}
        collapsable={false}
      />
      <View
        style={[styles.flexTestApp.child, {backgroundColor: '#0000ff'}]}
        collapsable={false}
      />
    </View>
  );
};

const FlexWithText = () => {
  return (
    <View
      style={styles.flexWithText.container}
      testID="container"
      collapsable={false}>
      <View style={styles.flexWithText.row} collapsable={false}>
        <Text style={styles.flexWithText.inner}>Hello</Text>
        <Text style={styles.flexWithText.inner}>World</Text>
      </View>
    </View>
  );
};

const AbsolutePositionTestApp = () => {
  return (
    <View
      style={styles.absolutePositionTestApp.absolute}
      testID="absolute"
      collapsable={false}
    />
  );
};

const AbsolutePositionBottomRightTestApp = () => {
  return (
    <View
      style={styles.absolutePositionBottomRightTestApp.container}
      testID="container"
      collapsable={false}>
      <View
        style={styles.absolutePositionBottomRightTestApp.absolute}
        collapsable={false}
      />
    </View>
  );
};

const CenteredTextView = props => {
  return (
    <View collapsable={false}>
      <View style={styles.centeredTextView.parent} collapsable={false}>
        <Text style={styles.centeredTextView.text} testID="text">
          {props.text}
        </Text>
      </View>
    </View>
  );
};

let flushUpdatePositionInList = null;
class UpdatePositionInListTestApp extends React.Component {
  constructor(props) {
    super(props);
    flushUpdatePositionInList = () => this.setState({active: true});
    this.state = {
      active: false,
    };
  }

  render() {
    return (
      <View collapsable={false} testID="container">
        <View
          style={styles.updatePositionInListTestApp.element}
          collapsable={false}
        />
        <View
          style={[
            styles.updatePositionInListTestApp.element,
            this.state.active && this.styles.active,
          ]}
          collapsable={false}
        />
        <View
          style={styles.updatePositionInListTestApp.element}
          collapsable={false}
        />
      </View>
    );
  }
}

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
  },
};

BatchedBridge.registerCallableModule(
  'UIManagerTestModule',
  UIManagerTestModule,
);

const styles = StyleSheet.create({
  flexTestApp: {
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
  },
  flexWithText: {
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
  },
  absolutePositionTestApp: {
    absolute: {
      position: 'absolute',
      top: 15,
      left: 10,
      width: 50,
      height: 60,
    },
  },
  absolutePositionBottomRightTestApp: {
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
  },
  centeredTextView: {
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
  },
  updatePositionInListTestApp: {
    element: {
      height: 10,
    },
    active: {
      height: 50,
    },
  },
});

module.exports = UIManagerTestModule;
