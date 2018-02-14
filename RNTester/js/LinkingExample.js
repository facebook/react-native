/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule LinkingExample
 */
'use strict';

var React = require('react');
var PropTypes = require('prop-types');
var ReactNative = require('react-native');
var {
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} = ReactNative;
var RNTesterBlock = require('./RNTesterBlock');

class OpenURLButton extends React.Component {
  static propTypes = {
    url: PropTypes.string,
  };

  handleClick = () => {
    Linking.canOpenURL(this.props.url).then(supported => {
      if (supported) {
        Linking.openURL(this.props.url);
      } else {
        console.log('Don\'t know how to open URI: ' + this.props.url);
      }
    });
  };

  render() {
    return (
      <TouchableOpacity
        onPress={this.handleClick}>
        <View style={styles.button}>
          <Text style={styles.text}>Open {this.props.url}</Text>
        </View>
      </TouchableOpacity>
    );
  }
}

class IntentAndroidExample extends React.Component {
  static title = 'Linking';
  static description = 'Shows how to use Linking to open URLs.';

  render() {
    return (
      <RNTesterBlock title="Open external URLs">
        <OpenURLButton url={'https://www.facebook.com'} />
        <OpenURLButton url={'http://www.facebook.com'} />
        <OpenURLButton url={'http://facebook.com'} />
        <OpenURLButton url={'fb://notifications'} />
        <OpenURLButton url={'geo:37.484847,-122.148386'} />
        <OpenURLButton url={'tel:9876543210'} />
      </RNTesterBlock>
    );
  }
}

var styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    padding: 10,
    paddingTop: 30,
  },
  button: {
    padding: 10,
    backgroundColor: '#3B5998',
    marginBottom: 10,
  },
  text: {
    color: 'white',
  },
});

module.exports = IntentAndroidExample;
