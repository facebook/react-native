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
        placeholder="test"
        // disableKeyboardShortcuts
        disableKeyboardShortcuts={false}
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
    borderColor: 'gray',
    borderWidth: 1,
  },
});

export default ({
  title: 'Playground',
  name: 'playground',
  render: (): React.Node => <Playground />,
}: RNTesterModuleExample);
