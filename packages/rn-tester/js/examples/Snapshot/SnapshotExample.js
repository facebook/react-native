/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

'use strict';

const ScreenshotManager = require('../../../NativeModuleExample/NativeScreenshotManager');
const {RNTesterThemeContext} = require('../../components/RNTesterTheme');
const React = require('react');
const {Alert, Image, StyleSheet, Text, View} = require('react-native');

class ScreenshotExample extends React.Component<{...}, $FlowFixMeState> {
  state: any | {uri: void} = {
    uri: undefined,
  };

  render(): React.Node {
    return (
      <RNTesterThemeContext.Consumer>
        {theme => (
          <View style={style.container}>
            <Text
              onPress={this.takeScreenshot}
              style={[style.button, {color: theme.LabelColor}]}>
              Click to take a screenshot
            </Text>
            <Image
              style={[style.image, {backgroundColor: theme.LabelColor}]}
              source={{uri: this.state.uri}}
            />
          </View>
        )}
      </RNTesterThemeContext.Consumer>
    );
  }

  takeScreenshot = () => {
    ScreenshotManager.takeScreenshot('window', {format: 'jpeg', quality: 0.8}) // See UIManager.js for options
      .then(uri => this.setState({uri}))
      .catch(error => Alert.alert(error));
  };
}

const style = StyleSheet.create({
  container: {
    flex: 1,
  },
  button: {
    marginBottom: 10,
    fontWeight: '500',
  },
  image: {
    flex: 1,
    resizeMode: 'contain',
  },
});

exports.title = 'Snapshot / Screenshot';
exports.category = 'Basic';
exports.description = 'API to capture images from the screen.';
exports.examples = [
  {
    title: 'Take screenshot',
    render(): React.Element<any> {
      return <ScreenshotExample />;
    },
  },
];
