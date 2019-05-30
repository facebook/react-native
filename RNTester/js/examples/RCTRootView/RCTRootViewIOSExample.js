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

const React = require('react');
const {
  StyleSheet,
  Text,
  View,
  requireNativeComponent,
} = require('react-native');

class AppPropertiesUpdateExample extends React.Component<{}> {
  render() {
    // Do not require this unless we are actually rendering.
    const UpdatePropertiesExampleView = requireNativeComponent(
      'UpdatePropertiesExampleView',
    );
    return (
      <View style={styles.container}>
        <Text style={styles.text}>
          Press the button to update the field below by passing new properties
          to the RN app.
        </Text>
        <UpdatePropertiesExampleView style={styles.nativeView}>
          <Text style={styles.text}>
            Error: This demo is accessible only from RNTester app
          </Text>
        </UpdatePropertiesExampleView>
      </View>
    );
  }
}

class RootViewSizeFlexibilityExample extends React.Component<{}> {
  render() {
    // Do not require this unless we are actually rendering.
    const FlexibleSizeExampleView = requireNativeComponent(
      'FlexibleSizeExampleView',
    );
    return (
      <View style={styles.container}>
        <Text style={styles.text}>
          Press the button to resize it. On resize, RCTRootViewDelegate is
          notified. You can use it to handle content size updates.
        </Text>
        <FlexibleSizeExampleView style={styles.nativeView}>
          <Text style={styles.text}>
            Error: This demo is accessible only from RNTester app
          </Text>
        </FlexibleSizeExampleView>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5FCFF',
  },
  text: {
    marginBottom: 20,
  },
  nativeView: {
    height: 140,
    width: 280,
  },
});

exports.title = 'RCTRootView';
exports.description =
  'Examples that show useful methods when embedding React Native in a native application';
exports.examples = [
  {
    title: 'Updating app properties in runtime',
    render(): React.Element<any> {
      return <AppPropertiesUpdateExample />;
    },
  },
  {
    title: "RCTRootView's size flexibility",
    render(): React.Element<any> {
      return <RootViewSizeFlexibilityExample />;
    },
  },
];
