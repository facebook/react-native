/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

import type {RNTesterModuleInfo} from './types/RNTesterTypes';

import * as React from 'react';
import {StyleSheet, Text, TextInput, View} from 'react-native';

// RNTester App currently uses in memory storage for storing navigation state

const RNTesterApp = ({
  testList,
}: {
  testList?: {
    components?: Array<RNTesterModuleInfo>,
    apis?: Array<RNTesterModuleInfo>,
  },
}): React.Node => {
  return (
    <View style={styles.container}>
      <Text>This is some Text</Text>
      <Text style={styles.text}>
        <Text>jjjj</Text>
        {'\n'}
        <Text>💀</Text>
      </Text>
      <Text>This is some TextInput</Text>
      <TextInput multiline style={styles.input} />
    </View>
  );
};

export default RNTesterApp;

const styles = StyleSheet.create({
  container: {
    marginTop: 250,
  },
  text: {
    lineHeight: 14,
    borderWidth: 1,
  },
  input: {
    lineHeight: 14,
    borderWidth: 1,
  },
});
