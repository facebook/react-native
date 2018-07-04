/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */
'use strict';

const React = require('react');
const ReactNative = require('react-native');
const {Alert, Image, StyleSheet, Text, View} = ReactNative;

class ScreenshotExample extends React.Component<{}, $FlowFixMeState> {
  state = {
    uri: undefined,
  };

  render() {
    return (
      <View>
        <Text onPress={this.takeScreenshot} style={style.button}>
          Click to take a screenshot
        </Text>
        <Image style={style.image} source={{uri: this.state.uri}} />
      </View>
    );
  }

  takeScreenshot = () => {
    ReactNative.takeSnapshot('window', {format: 'jpeg', quality: 0.8}) // See UIManager.js for options
      .then(uri => this.setState({uri}))
      .catch(error => Alert.alert(error));
  };
}

const style = StyleSheet.create({
  button: {
    marginBottom: 10,
    fontWeight: '500',
  },
  image: {
    flex: 1,
    height: 300,
    resizeMode: 'contain',
    backgroundColor: 'black',
  },
});

exports.title = 'Snapshot / Screenshot';
exports.description = 'API to capture images from the screen.';
exports.examples = [
  {
    title: 'Take screenshot',
    render(): React.Element<any> {
      return <ScreenshotExample />;
    },
  },
];
