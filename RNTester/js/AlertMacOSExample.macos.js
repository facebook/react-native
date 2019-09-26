/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
'use strict';

var React = require('react');
var ReactNative = require('react-native');
var {
  StyleSheet,
  View,
  Text,
  TouchableHighlight,
  AlertMacOS,
} = ReactNative;

var { SimpleAlertExampleBlock } = require('./AlertExample');

exports.framework = 'React';
exports.title = 'AlertMacOS';
exports.description = 'macOS alerts';
exports.examples = [{
  title: 'Alerts',
  render() {
    return <SimpleAlertExampleBlock />;
  },
},
{
  title: 'Prompt Options',
  render(): React.Element<any> {
    return <PromptOptions />;
  },
},
{
  title: 'Prompt Types',
  render() {
    return (
      <View>
        <TouchableHighlight
          style={styles.wrapper}
          onPress={() => AlertMacOS.prompt('Plain Text Entry')}>

          <View style={styles.button}>
            <Text>
              plain-text
            </Text>
          </View>

        </TouchableHighlight>
        <TouchableHighlight
          style={styles.wrapper}
          onPress={() => AlertMacOS.prompt('Secure Text', null, null, 'secure-text')}>

          <View style={styles.button}>
            <Text>
              secure-text
            </Text>
          </View>

        </TouchableHighlight>
        <TouchableHighlight
          style={styles.wrapper}
          onPress={() => AlertMacOS.prompt(
            'Login & Password',
            null,
            null,
            'login-password',
            [
              {default: '', placeholder: 'login'},
              {default: '', placeholder: 'Password'},
            ],
          )}>

          <View style={styles.button}>
            <Text>
              login-password
            </Text>
          </View>

        </TouchableHighlight>
      </View>
    );
  },
},
{
  title: 'Prompt Presentation',
  render() {
    return (
      <View>
        <TouchableHighlight
          style={styles.wrapper}
          onPress={() => AlertMacOS.prompt(
            'Default sheet',
            null,
            null,
            'default',
            [
              {default: '', placeholder: ''},
            ],
            false
          )}>

          <View style={styles.button}>
            <Text>
              Default sheet
            </Text>
          </View>

        </TouchableHighlight>
        <TouchableHighlight
          style={styles.wrapper}
          onPress={() => AlertMacOS.prompt(
            'Modal',
            null,
            null,
            'default',
            [
              {default: '', placeholder: ''},
            ],
            true
          )}>

          <View style={styles.button}>
            <Text>
              Modal
            </Text>
          </View>

        </TouchableHighlight>
      </View>
    );
  },
},
{
  title: 'Prompt Style',
  render() {
    return (
      <View>
        <TouchableHighlight
          style={styles.wrapper}
          onPress={() => AlertMacOS.prompt(
            'Default warning style',
            null,
            null,
            'default'
          )}>

          <View style={styles.button}>
            <Text>
              Default warning style
            </Text>
          </View>

        </TouchableHighlight>
        <TouchableHighlight
          style={styles.wrapper}
          onPress={() => AlertMacOS.prompt(
            'Critical',
            null,
            null,
            'default',
            [
              {default: '', placeholder: ''},
            ],
            false,
            true)
          }>

          <View style={styles.button}>
            <Text>
              Critical
            </Text>
          </View>

        </TouchableHighlight>
      </View>
    );
  },
},
];

class PromptOptions extends React.Component<$FlowFixMeProps, any> {
  state: any;
  customButtons: Array<Object>;

  constructor(props) {
    super(props);

    // $FlowFixMe this seems to be a Flow bug, `saveResponse` is defined below
    this.saveResponse = this.saveResponse.bind(this);

    this.customButtons = [{
      text: 'Custom OK',
      onPress: this.saveResponse,
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
          onPress={() => AlertMacOS.prompt('Type a value', null, this.saveResponse)}>

          <View style={styles.button}>
            <Text>
              prompt with title & callback
            </Text>
          </View>
        </TouchableHighlight>

        <TouchableHighlight
          style={styles.wrapper}
          onPress={() => AlertMacOS.prompt('Type a value', null, this.customButtons)}>

          <View style={styles.button}>
            <Text>
              prompt with title & custom buttons
            </Text>
          </View>
        </TouchableHighlight>

        <TouchableHighlight
          style={styles.wrapper}
          onPress={() => AlertMacOS.prompt(
            'Type a value',
            null,
            this.saveResponse,
            undefined,
            [
              {default: 'Default value', placeholder: ''},
            ],
          )}>

          <View style={styles.button}>
            <Text>
              prompt with title, callback & default inputs
            </Text>
          </View>
        </TouchableHighlight>

        <TouchableHighlight
          style={styles.wrapper}
          onPress={() => AlertMacOS.prompt(
            'Type a value',
            null,
            this.customButtons,
            'login-password',
            [
              {default: 'admin@site.com', placeholder: 'login'},
              {default: '', placeholder: 'password'},
            ],
          )}>

          <View style={styles.button}>
            <Text>
              prompt with title, custom buttons, login/password & default inputs
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
