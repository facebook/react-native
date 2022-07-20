/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

import * as React from 'react';
import {View, Text, StyleSheet} from 'react-native';

import type {ViewStyleProp} from 'react-native/Libraries/StyleSheet/StyleSheet';

type Props = $ReadOnly<{|
  instructions?: $ReadOnlyArray<string>,
  style?: ?ViewStyleProp,
|}>;
export default function RNTesterPlatformTestInstructions({
  instructions,
  style,
}: Props): React.MixedElement | null {
  if (instructions == null) {
    return null;
  }
  return (
    <View style={style}>
      {instructions.map((instruction, idx) => {
        return (
          <Text key={idx} style={styles.instructionText}>
            {idx + 1}. {instruction}
          </Text>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  instructionText: {
    fontSize: 16,
  },
});
