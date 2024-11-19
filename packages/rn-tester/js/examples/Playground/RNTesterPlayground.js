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

import type {RNTesterModuleExample} from '../../types/RNTesterTypes';

import RNTesterText from '../../components/RNTesterText';
import * as React from 'react';
import {StyleSheet, View, TextInput} from 'react-native';

function Playground() {
  return (
    <View style={styles.container}>
      <RNTesterText>
        Edit "RNTesterPlayground.js" to change this file
      </RNTesterText>

      <TextInput
        style={styles.input}
        placeholder="Single line - default"
        placeholderTextColor="black"
      />

      <TextInput
        style={styles.input}
        placeholder="Single line - disableKeyboardShortcuts"
        disableKeyboardShortcuts
        placeholderTextColor="black"
      />

      <TextInput
        style={styles.input}
        placeholder="Single line - No keyboard with suggestions"
        placeholderTextColor="black"
        showSoftInputOnFocus={false}
      />

      <TextInput
        style={styles.input}
        placeholder="Single line - No keyboard without suggestions"
        disableKeyboardShortcuts
        placeholderTextColor="black"
        autoCorrect={false}
        spellCheck={false}
        showSoftInputOnFocus={false}
      />

      <TextInput
        style={styles.input}
        placeholder="Multiline - default"
        multiline
        placeholderTextColor="black"
      />

      <TextInput
        style={styles.input}
        placeholder="Multiline - disableKeyboardShortcuts"
        multiline
        disableKeyboardShortcuts
        placeholderTextColor="black"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 10,
  },
  input: {
    width: '100%',
    height: 40,
    marginTop: 16,
    paddingLeft: 8,
    borderColor: 'gray',
    borderWidth: 1,
  },
});

export default ({
  title: 'Playground',
  name: 'playground',
  render: (): React.Node => <Playground />,
}: RNTesterModuleExample);
