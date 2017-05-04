/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 * @providesModule AlertIOSExample
 */
'use strict';

var React = require('react');
var ReactNative = require('react-native');
var {
  StyleSheet,
  View,
  Text,
  TouchableHighlight,
  AlertIOS,
} = ReactNative;

var { SimpleAlertExampleBlock } = require('./AlertExample');

exports.framework = 'React';
exports.title = 'AlertIOS';
exports.description = 'iOS alerts and action sheets';
exports.examples = [{
  title: 'Alerts',
  render() {
    return <SimpleAlertExampleBlock />;
  }
},
{
  title: 'Prompt Options',
  render(): React.Element<any> {
    return <PromptOptions />;
  }
},
{
  title: 'Prompt Types',
  render() {
    return (
      <View>
        <TouchableHighlight
          style={styles.wrapper}
          onPress={() => AlertIOS.prompt('Plain Text Entry')}>

          <View style={styles.button}>
            <Text>
              plain-text
            </Text>
          </View>

        </TouchableHighlight>
        <TouchableHighlight
          style={styles.wrapper}
          onPress={() => AlertIOS.prompt('Secure Text', null, null, 'secure-text')}>

          <View style={styles.button}>
            <Text>
              secure-text
            </Text>
          </View>

        </TouchableHighlight>
        <TouchableHighlight
          style={styles.wrapper}
          onPress={() => AlertIOS.prompt('Login & Password', null, null, 'login-password')}>

          <View style={styles.button}>
            <Text>
              login-password
            </Text>
          </View>

        </TouchableHighlight>
      </View>
    );
  }
}];

class PromptOptions extends React.Component {
  state: any;
  customButtons: Array<Object>;

  constructor(props) {
    super(props);

    // $FlowFixMe this seems to be a Flow bug, `saveResponse` is defined below
    this.saveResponse = this.saveResponse.bind(this);

    this.customButtons = [{
      text: 'Custom OK',
      onPress: this.saveResponse
    }, {
      text: 'Custom Cancel',
      style: 'cancel',
    }];

    this.state = {
      promptValue: undefined,
    };
  }

  render() {
    return (
      <View>
        <Text style={{marginBottom: 10}}>
          <Text style={{fontWeight: 'bold'}}>Prompt value:</Text> {this.state.promptValue}
        </Text>

        <TouchableHighlight
          style={styles.wrapper}
          onPress={() => AlertIOS.prompt('Type a value', null, this.saveResponse)}>

          <View style={styles.button}>
            <Text>
              prompt with title & callback
            </Text>
          </View>
        </TouchableHighlight>

        <TouchableHighlight
          style={styles.wrapper}
          onPress={() => AlertIOS.prompt('Type a value', null, this.customButtons)}>

          <View style={styles.button}>
            <Text>
              prompt with title & custom buttons
            </Text>
          </View>
        </TouchableHighlight>

        <TouchableHighlight
          style={styles.wrapper}
          onPress={() => AlertIOS.prompt('Type a phone number', null, null, 'plain-text', undefined, 'phone-pad')}>

          <View style={styles.button}>
            <Text>
              prompt with title & custom keyboard
            </Text>
          </View>
        </TouchableHighlight>

        <TouchableHighlight
          style={styles.wrapper}
          onPress={() => AlertIOS.prompt('Type a value', null, this.saveResponse, undefined, 'Default value')}>

          <View style={styles.button}>
            <Text>
              prompt with title, callback & default value
            </Text>
          </View>
        </TouchableHighlight>

        <TouchableHighlight
          style={styles.wrapper}
          onPress={() => AlertIOS.prompt('Type a value', null, this.customButtons, 'login-password', 'admin@site.com')}>

          <View style={styles.button}>
            <Text>
              prompt with title, custom buttons, login/password & default value
            </Text>
          </View>
        </TouchableHighlight>
      </View>
    );
  }

  saveResponse(promptValue) {
    this.setState({ promptValue: JSON.stringify(promptValue) });
  }
}

var styles = StyleSheet.create({
  wrapper: {
    borderRadius: 5,
    marginBottom: 5,
  },
  button: {
    backgroundColor: '#eeeeee',
    padding: 10,
  },
});
