/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

import type {PlatformTestComponentBaseProps} from './RNTesterPlatformTestTypes';

import * as React from 'react';
import {StyleSheet, View, Text, ScrollView} from 'react-native';

import RNTesterPlatformTestInstructions from './RNTesterPlatformTestInstructions';
import usePlatformTestHarness from './usePlatformTestHarness';
import RNTesterPlatformTestResultView from './RNTesterPlatformTestResultView';

type Props = $ReadOnly<{|
  title: string,
  description: string,
  instructions?: $ReadOnlyArray<string>,
  component: React.ComponentType<PlatformTestComponentBaseProps>,
|}>;

export default function RNTesterPlatformTest(props: Props): React.MixedElement {
  const {
    title,
    description,
    instructions,
    component: UnderTestComponent,
  } = props;

  const {harness, reset, results, testKey} = usePlatformTestHarness();

  return (
    <ScrollView style={styles.root}>
      <Text style={[styles.textBlock, styles.title]}>{title}</Text>
      <Text style={[styles.textBlock, styles.description]}>{description}</Text>
      <RNTesterPlatformTestInstructions
        instructions={instructions}
        style={styles.block}
      />
      <View style={styles.block}>
        <UnderTestComponent key={testKey} harness={harness} />
      </View>
      <RNTesterPlatformTestResultView
        reset={reset}
        results={results}
        style={styles.block}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  block: {
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
  },
  textBlock: {
    marginBottom: 8,
  },
  root: {
    padding: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
  },
});
