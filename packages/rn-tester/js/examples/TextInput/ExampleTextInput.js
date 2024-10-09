/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 * @oncall react_native
 */

import {RNTesterThemeContext} from '../../components/RNTesterTheme';
import React, {forwardRef, useContext, useState} from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  Button,
  Text,
  TouchableOpacity,
  Clipboard,
  Alert,
} from 'react-native';

const ExampleTextInput: React.AbstractComponent<
  React.ElementConfig<typeof TextInput>,
  $ReadOnly<{|
    ...React.ElementRef<typeof TextInput>,
  |}>,
> = forwardRef((props, ref) => {
  const [inputText, setInputText] = useState('');
  const [displayText, setDisplayText] = useState('');

  const handleSend = () => {
    setDisplayText(inputText);
    setInputText('');
  };

  const handleLongPress = () => {
    Clipboard.setString(displayText);
    Alert.alert('Copied to Clipboard', displayText);
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        value={inputText}
        multiline={true}
        onChangeText={setInputText}
      />
      <Button title="Send" onPress={handleSend} />
      <TouchableOpacity onLongPress={handleLongPress}>
        <Text style={styles.displayText}>{displayText}</Text>
      </TouchableOpacity>
    </View>
  );
});

const styles = StyleSheet.create({
  input2: {
    borderWidth: 1,
    fontSize: 13,
    flexGrow: 1,
    flexShrink: 1,
    padding: 4,
  },
  container: {
    padding: 20,
    backgroundColor: '#fff',
    flex: 1,
    justifyContent: 'center',
  },
  input: {
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 20,
    paddingHorizontal: 10,
    fontSize: 13,
    flexGrow: 1,
    flexShrink: 1,
    borderRadius: 5,
  },
  displayText: {
    marginTop: 20,
    fontSize: 16,
    color: '#333',
    padding: 10,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    textAlign: 'center',
  },
});

export default ExampleTextInput;
