/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule TextInputTestModule
 */

"use strict";

var BatchedBridge = require('BatchedBridge');
var React = require('React');
var StyleSheet = require('StyleSheet');
var Text = require('Text');
var TextInput = require('TextInput');
var View = require('View');

var app;

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
    let token, index, parts = [];
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
    parts = parts.map((text) => {
      if (/^#/.test(text)) {
        return <Text key={text} style={styles.hashtag}>{text}</Text>;
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
          onChangeText={(text) => {
            this.setState({text});
          }}>
          <Text>{parts}</Text>
        </TextInput>
      </View>
    );
  }
}

var TextInputTestApp = React.createClass({
  componentDidMount: function() {
    app = this;
  },

  render: function() {
    return (
      <View style={styles.container}>
        <TextInput
          style={styles.textInputHeight}
          autoCorrect={true}
          autoFocus={true}
          keyboardType='numeric'
          multiline={true}
          password={true}
          defaultValue="This is text"
          testID="textInput1"
        />
        <TextInput
          style={styles.textInput}
          autoCapitalize='sentences'
          autoCorrect={false}
          autoFocus={false}
          keyboardType='default'
          multiline={false}
          password={false}
          placeholder='1234'
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
          style={[styles.textInput, {color: '#00ff00'}]}
          testID="textInput4"
        />
        <TextInput
          ref="textInput5"
          style={[styles.textInput, {color: '#00ff00'}]}
          defaultValue=""
          testID="textInput5"
        />
        <TextInput
          ref="textInput6"
          style={[styles.textInput, {color: '#00ff00'}]}
          defaultValue="Text"
          testID="textInput6"
        />
        <TokenizedTextExample />
      </View>
    );
  },
});

var styles = StyleSheet.create({
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
});

var TextInputTestModule = {
  TextInputTestApp,
  setValueRef: function(ref, value) {
    app.refs[ref].setNativeProps({
      text: value,
    });
  },
};

BatchedBridge.registerCallableModule(
  'TextInputTestModule',
  TextInputTestModule
);

module.exports = TextInputTestModule;
