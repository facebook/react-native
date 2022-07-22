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

import RNTesterPlatformTestResultsText from './RNTesterPlatformTestResultsText';

import * as React from 'react';
import {View, Text, StyleSheet, TouchableHighlight} from 'react-native';

type Props = $ReadOnly<{|
  numFail: number,
  numError: number,
  numPass: number,
  numPending: number,
  numSkipped: number,
  onPress?: () => void,
  style?: ?ViewStyleProp,
|}>;
export default function RNTesterPlatformTestMinimizedResultView({
  numFail,
  numError,
  numPass,
  numPending,
  numSkipped,
  onPress,
  style,
}: Props): React.MixedElement {
  return (
    <TouchableHighlight onPress={onPress} style={[styles.root, style]}>
      <View style={styles.innerContainer}>
        <Text style={styles.statsContainer}>
          <RNTesterPlatformTestResultsText
            numError={numError}
            numFail={numFail}
            numPass={numPass}
            numPending={numPending}
            numSkipped={numSkipped}
          />
        </Text>
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
  innerContainer: {
    width: '100%',
    height: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    backgroundColor: 'white',
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
    marginStart: 8,
  },
});
