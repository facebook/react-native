/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict'; // TODO(OSS Candidate ISS#2710739)

var React = require('react');
var ReactNative = require('react-native');
var Platform = require('Platform');
var {StyleSheet, Text, View, TextInput} = ReactNative;

type State = {
  eventStream: string;
};

class FocusEventExample extends React.Component<{}, State> {
  state: State = {
    eventStream: '',
  };

  render() {
    return (
      <View>
        <Text>
          Focus events are called when a component receives or loses focus.
          This can be acquired by manually focusing components {Platform.OS === 'macos' ? ' or using tab-based nav' : '' }
        </Text>
        <View>
          <TextInput
            onFocus={() => {
              this.setState((prevState) => ({ eventStream: prevState.eventStream + '\nTextInput Focus' }));
            }}
            onBlur={() => {
              this.setState((prevState) => ({ eventStream: prevState.eventStream + '\nTextInput Blur' }));
            }}
            style={styles.default}
          />
          
          {// Only test View on MacOS, since canBecomeFirstResponder is false on all iOS, therefore we can't focus
            Platform.OS === 'macos' ?
            <View style={styles.default}
              acceptsKeyboardFocus={true}onFocus={() => {
                this.setState((prevState) => ({ eventStream: prevState.eventStream + '\nView Focus' }));
              }}
              onBlur={() => {
                this.setState((prevState) => ({ eventStream: prevState.eventStream + '\nView Blur' }));
              }}
            >
              <Text>
                Focusable View
              </Text>
            </View>
            : null}
          <Text>
            {'Events: ' + this.state.eventStream + '\n\n'}
          </Text>
        </View>
      </View>
    );
  }
}

var styles = StyleSheet.create({
  default: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#0f0f0f',
    flex: 1,
    fontSize: 13,
    padding: 4,
  },
});

exports.title = 'Focus Events';
exports.description =
  'Examples that show how Focus events can be used.';
exports.examples = [
  {
    title: 'FocusEventExample',
    render: function(): React.Element<any> {
      return <FocusEventExample />;
    },
  },
];
