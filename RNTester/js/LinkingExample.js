/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

const React = require('react');
const {
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} = require('react-native');

const RNTesterBlock = require('./RNTesterBlock');

type Props = $ReadOnly<{|
  url?: ?string,
|}>;

class OpenURLButton extends React.Component<Props> {
  handleClick = () => {
    Linking.canOpenURL(this.props.url).then(supported => {
      if (supported) {
        Linking.openURL(this.props.url);
      } else {
        console.log("Don't know how to open URI: " + this.props.url);
      }
    });
  };

  render() {
    return (
      <TouchableOpacity onPress={this.handleClick}>
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

const styles = StyleSheet.create({
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
