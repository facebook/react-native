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
  NativeModules,
  StyleSheet,
  Text,
  TextInput,
  View,
} = require('react-native');
const BatchedBridge = require('react-native/Libraries/BatchedBridge/BatchedBridge');

const {Recording} = NativeModules;

let app;

class TokenizedTextExample extends React.Component {
  constructor(props) {
    super(props);
    this.state = {text: ''};
  }
  render() {
    //define delimiter
    let delimiter = /\s+/;

    //split string
    let _text = this.state.text;
    let token,
      index,
      parts = [];
    while (_text) {
      delimiter.lastIndex = 0;
      token = delimiter.exec(_text);
      if (token === null) {
        break;
      }
      index = token.index;
      if (token[0].length === 0) {
        index = 1;
      }
      parts.push(_text.substr(0, index));
      parts.push(token[0]);
      index = index + token[0].length;
      _text = _text.slice(index);
    }
    parts.push(_text);

    //highlight hashtags
    parts = parts.map(text => {
      if (/^#/.test(text)) {
        return (
          <Text key={text} style={styles.hashtag}>
            {text}
          </Text>
        );
      } else {
        return text;
      }
    });

    return (
      <View>
        <TextInput
          ref="tokenizedInput"
          testID="tokenizedInput"
          multiline={true}
          style={styles.multiline}
          onChangeText={text => {
            this.setState({text});
          }}>
          <Text>{parts}</Text>
        </TextInput>
      </View>
    );
  }
}

class TextInputTestApp extends React.Component {
  componentDidMount() {
    app = this;
  }

  handleOnSubmitEditing = record => {
    Recording.record(record);
  };

  render() {
    return (
      <View style={styles.container}>
        <TextInput
          style={styles.textInputHeight}
          autoCorrect={true}
          autoFocus={true}
          keyboardType="numeric"
          multiline={true}
          secureTextEntry={true}
          defaultValue="This is text"
          testID="textInput1"
        />
        <TextInput
          style={styles.textInput}
          autoCapitalize="sentences"
          autoCorrect={false}
          autoFocus={false}
          keyboardType="default"
          multiline={false}
          secureTextEntry={false}
          placeholder="1234"
          testID="textInput2"
        />
        <TextInput
          ref="textInput3"
          style={styles.textInput}
          defaultValue="Hello, World"
          testID="textInput3"
        />
        <TextInput
          ref="textInput4"
          style={[styles.textInput, styles.textInputColor]}
          testID="textInput4"
        />
        <TextInput
          ref="textInput5"
          style={[styles.textInput, styles.textInputColor]}
          defaultValue=""
          testID="textInput5"
        />
        <TextInput
          ref="textInput6"
          style={[styles.textInput, styles.textInputColor]}
          defaultValue="Text"
          testID="textInput6"
        />
        <TextInput
          ref="onSubmitTextInput"
          onSubmitEditing={this.handleOnSubmitEditing.bind(this, 'onSubmit')}
          defaultValue=""
          testID="onSubmitTextInput"
        />
        <TokenizedTextExample />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    padding: 5,
    margin: 10,
  },
  textInputHeight: {
    fontSize: 21,
    height: 30,
  },
  textInput: {
    fontSize: 21,
    padding: 0,
  },
  hashtag: {
    color: 'blue',
    fontWeight: 'bold',
  },
  textInputColor: {
    marginLeft: 20,
  },
});

const TextInputTestModule = {
  TextInputTestApp,
  setValueRef: function(ref, value) {
    app.refs[ref].setNativeProps({
      text: value,
    });
  },
};

BatchedBridge.registerCallableModule(
  'TextInputTestModule',
  TextInputTestModule,
);

module.exports = TextInputTestModule;
