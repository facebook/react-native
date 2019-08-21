/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

import type {Node} from 'react';
import {Platform, StyleSheet, Text} from 'react-native';
import React from 'react';

const styles = StyleSheet.create({
  highlight: {
    fontWeight: '700',
  },
});

const DebugInstructions: () => Node = Platform.select({
  ios: () => (
    <Text>
      Press <Text style={styles.highlight}>Cmd + D</Text> in the simulator or{' '}
      <Text style={styles.highlight}>Shake</Text> your device to open the React
      Native debug menu.
    </Text>
  ),
  default: () => (
    <Text>
      Press <Text style={styles.highlight}>Cmd or Ctrl + M</Text> or{' '}
      <Text style={styles.highlight}>Shake</Text> your device to open the React
      Native debug menu.
    </Text>
  ),
});

export default DebugInstructions;
