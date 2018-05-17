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

const React = require('React');
const ReactNative = require('react-native');
const {
  Alert,
  Button,
  InputAccessoryView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} = ReactNative;

class Message extends React.PureComponent<*> {
  render() {
    return (
      <View style={styles.textBubbleBackground}>
        <Text style={styles.text}>Text Message</Text>
      </View>
    );
  }
}

class TextInputBar extends React.PureComponent<*, *> {
  state = {text: ''};

  render() {
    return (
      <View style={styles.textInputContainer}>
        <TextInput
          style={styles.textInput}
          onChangeText={text => {
            this.setState({text});
          }}
          value={this.state.text}
          placeholder={'Type a message...'}
        />
        <Button
          onPress={() => {
            Alert.alert('You tapped the button!');
          }}
          title="Send"
        />
      </View>
    );
  }
}

class InputAccessoryViewExample extends React.Component<*> {
  static title = '<InputAccessoryView>';
  static description = 'Example showing how to use an InputAccessoryView to build an iMessage-like sticky text input';

  render() {
    return (
      <View>
        <ScrollView keyboardDismissMode="interactive">
          {Array(15)
            .fill()
            .map((_, i) => <Message key={i} />)}
        </ScrollView>
        <InputAccessoryView backgroundColor="#fffffff7">
          <TextInputBar />
        </InputAccessoryView>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  textInputContainer: {
    flexDirection: 'row',
  },
  textInput: {
    flex: 1,
    paddingLeft: 10,
  },
  text: {
    padding: 10,
    color: 'white',
  },
  textBubbleBackground: {
    backgroundColor: '#2f7bf6',
    borderRadius: 20,
    width: 110,
    margin: 20,
  },
});

module.exports = InputAccessoryViewExample;
