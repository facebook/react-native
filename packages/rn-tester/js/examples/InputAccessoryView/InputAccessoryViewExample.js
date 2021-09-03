/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

const React = require('react');
const {
  Alert,
  Button,
  InputAccessoryView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} = require('react-native');

type MessageProps = $ReadOnly<{||}>;
class Message extends React.PureComponent<MessageProps> {
  render() {
    return (
      <View style={styles.textBubbleBackground}>
        <Text style={styles.text}>Text Message</Text>
      </View>
    );
  }
}

type TextInputProps = $ReadOnly<{||}>;
type TextInputState = {|text: string|};
class TextInputBar extends React.PureComponent<TextInputProps, TextInputState> {
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

const BAR_HEIGHT = 44;
type InputAccessoryProps = $ReadOnly<{||}>;
class InputAccessoryViewExample extends React.Component<InputAccessoryProps> {
  render() {
    return (
      <>
        <ScrollView style={styles.fill} keyboardDismissMode="interactive">
          {Array(15)
            .fill()
            .map((_, i) => (
              <Message key={i} />
            ))}
        </ScrollView>
        <InputAccessoryView backgroundColor="#fffffff7">
          <TextInputBar />
        </InputAccessoryView>
      </>
    );
  }
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  textInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    height: BAR_HEIGHT,
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

exports.title = 'InputAccessoryView';
exports.description =
  'Example showing how to use an InputAccessoryView to build an iMessage-like sticky text input';
exports.examples = [
  {
    title: 'Simple view with sticky input',
    render: function(): React.Node {
      return <InputAccessoryViewExample />;
    },
  },
];
