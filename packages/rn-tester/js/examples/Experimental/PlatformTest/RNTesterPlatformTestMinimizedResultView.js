/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

import type {ViewStyleProp} from 'react-native/Libraries/StyleSheet/StyleSheet';

import * as React from 'react';
import {View, Text, StyleSheet, TouchableHighlight} from 'react-native';

type Props = $ReadOnly<{|
  numFail: number,
  numError: number,
  numPass: number,
  numPending: number,
  onPress?: () => void,
  style?: ?ViewStyleProp,
|}>;
export default function RNTesterPlatformTestMinimizedResultView({
  numFail,
  numError,
  numPass,
  numPending,
  onPress,
  style,
}: Props): React.MixedElement {
  return (
    <TouchableHighlight onPress={onPress} style={[styles.root, style]}>
      <View style={styles.innerContainer}>
        <View style={styles.statsContainer}>
          <Text style={styles.summaryText}>
            {numPass} <Text style={styles.passText}>Pass</Text>
          </Text>
          <Text style={styles.summaryText}>
            {numFail} <Text style={styles.failText}>Fail</Text>
          </Text>
          <Text style={styles.summaryText}>
            {numError} <Text style={styles.errorText}>Error</Text>
          </Text>
          <Text style={styles.summaryText}>
            {numPending} <Text style={styles.pendingText}>Pending</Text>
          </Text>
        </View>
        <Text style={styles.caret}>⌃</Text>
      </View>
    </TouchableHighlight>
  );
}

const styles = StyleSheet.create({
  caret: {
    fontSize: 24,
    transform: [{translateY: 4}],
    marginEnd: 8,
    opacity: 0.5,
  },
  errorText: {
    color: 'orange',
  },
  failText: {
    color: 'red',
  },
  innerContainer: {
    width: '100%',
    height: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    backgroundColor: 'white',
  },
  passText: {
    color: 'green',
  },
  pendingText: {
    color: 'gray',
  },
  root: {
    borderTopColor: 'rgb(171, 171, 171)',
    borderTopWidth: StyleSheet.hairlineWidth,
    minHeight: 60,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  summaryText: {
    marginStart: 8,
  },
});
