/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
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
  View,
  Text,
  TouchableHighlight,
  Alert,
} = require('react-native');

import {examples as SharedAlertExamples} from './AlertExample';

import type {RNTesterModuleExample} from '../../types/RNTesterTypes';

type Props = $ReadOnly<{||}>;
type State = {|promptValue: ?string|};

class PromptOptions extends React.Component<Props, State> {
  customButtons: Array<Object>;

  constructor(props: void | Props) {
    super(props);

    /* $FlowFixMe[cannot-write] this seems to be a Flow bug, `saveResponse` is
     * defined below */
    // $FlowFixMe[method-unbinding] added when improving typing for this parameters
    this.saveResponse = this.saveResponse.bind(this);

    this.customButtons = [
      {
        text: 'Custom OK',
        onPress: this.saveResponse,
      },
      {
        text: 'Custom Cancel',
        style: 'cancel',
      },
    ];

    this.state = {
      promptValue: undefined,
    };
  }

  render(): React.Node {
    return (
      <View>
        <Text style={styles.promptValue}>
          <Text style={styles.promptValueLabel}>Prompt value:</Text>{' '}
          {this.state.promptValue}
        </Text>

        <TouchableHighlight
          style={styles.wrapper}
          // $FlowFixMe[method-unbinding] added when improving typing for this parameters
          // $FlowFixMe[incompatible-call]
          onPress={() => Alert.prompt('Type a value', null, this.saveResponse)}>
          <View style={styles.button}>
            <Text>prompt with title & callback</Text>
          </View>
        </TouchableHighlight>

        <TouchableHighlight
          style={styles.wrapper}
          onPress={() =>
            Alert.prompt('Type a value', null, this.customButtons)
          }>
          <View style={styles.button}>
            <Text>prompt with title & custom buttons</Text>
          </View>
        </TouchableHighlight>

        <TouchableHighlight
          style={styles.wrapper}
          onPress={() =>
            Alert.prompt(
              'Type a phone number',
              null,
              null,
              'plain-text',
              undefined,
              'phone-pad',
            )
          }>
          <View style={styles.button}>
            <Text>prompt with title & custom keyboard</Text>
          </View>
        </TouchableHighlight>

        <TouchableHighlight
          style={styles.wrapper}
          onPress={() =>
            Alert.prompt(
              'Type a value',
              null,
              // $FlowFixMe[method-unbinding] added when improving typing for this parameters
              // $FlowFixMe[incompatible-call]
              this.saveResponse,
              undefined,
              'Default value',
            )
          }>
          <View style={styles.button}>
            <Text>prompt with title, callback & default value</Text>
          </View>
        </TouchableHighlight>

        <TouchableHighlight
          style={styles.wrapper}
          onPress={() =>
            Alert.prompt(
              'Type a value',
              null,
              this.customButtons,
              'login-password',
              'admin@site.com',
            )
          }>
          <View style={styles.button}>
            <Text>
              prompt with title, custom buttons, login/password & default value
            </Text>
          </View>
        </TouchableHighlight>
      </View>
    );
  }

  saveResponse(promptValue: any) {
    this.setState({promptValue: JSON.stringify(promptValue)});
  }
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: 5,
    marginBottom: 5,
  },
  button: {
    backgroundColor: '#eeeeee',
    padding: 10,
  },
  promptValue: {
    marginBottom: 10,
  },
  promptValueLabel: {
    fontWeight: 'bold',
  },
});

exports.framework = 'React';
exports.title = 'Alerts';
exports.description = 'iOS alerts and action sheets';
exports.documentationURL = 'https://reactnative.dev/docs/alert';
exports.examples = ([
  ...SharedAlertExamples,
  {
    title: 'Prompt Options',
    render(): React.Element<any> {
      return <PromptOptions />;
    },
  },
  {
    title: 'Prompt Types',
    render(): React.Node {
      return (
        <View>
          <TouchableHighlight
            style={styles.wrapper}
            onPress={() => Alert.prompt('Plain Text Entry')}>
            <View style={styles.button}>
              <Text>plain-text</Text>
            </View>
          </TouchableHighlight>
          <TouchableHighlight
            style={styles.wrapper}
            onPress={() =>
              Alert.prompt('Secure Text', null, null, 'secure-text')
            }>
            <View style={styles.button}>
              <Text>secure-text</Text>
            </View>
          </TouchableHighlight>
          <TouchableHighlight
            style={styles.wrapper}
            onPress={() =>
              Alert.prompt('Login & Password', null, null, 'login-password')
            }>
            <View style={styles.button}>
              <Text>login-password</Text>
            </View>
          </TouchableHighlight>
        </View>
      );
    },
  },
]: Array<RNTesterModuleExample>);
