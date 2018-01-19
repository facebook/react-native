/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 * @providesModule RootViewSizeFlexibilityExampleApp
 */
'use strict';

const React = require('react');
const ReactNative = require('react-native');
const {
  StyleSheet,
  Text,
  TouchableHighlight,
  View,
} = ReactNative;

class RootViewSizeFlexibilityExampleApp extends React.Component<{toggled: boolean}, any> {
  constructor(props: {toggled: boolean}) {
    super(props);
    this.state = { toggled: false };
  }

  _onPressButton() {
    this.setState({ toggled: !this.state.toggled });
  }

  render() {
    const viewStyle = this.state.toggled ? styles.bigContainer : styles.smallContainer;

    return (
      <TouchableHighlight onPress={this._onPressButton.bind(this)}>
        <View style={viewStyle}>
          <View style={styles.center}>
            <Text style={styles.whiteText}>
              React Native Button
            </Text>
          </View>
        </View>
      </TouchableHighlight>
    );
  }
}

const styles = StyleSheet.create({
  bigContainer: {
    flex: 1,
    height: 60,
    backgroundColor: 'gray',
  },
  smallContainer: {
    flex: 1,
    height: 40,
    backgroundColor: 'gray',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  whiteText: {
    color: 'white',
  }
});

module.exports = RootViewSizeFlexibilityExampleApp;
