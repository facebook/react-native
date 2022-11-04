/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

import {Button, Text, StyleSheet, View} from 'react-native';
import * as React from 'react';
import {useState} from 'react';

export default function TextAdjustsDynamicLayoutExample(props: {}): React.Node {
  const [height, setHeight] = useState(20);
  return (
    <>
      <View>
        <Text accessible={true}>
          My number is{' '}
          <Text
            accessibilityRole="date"
            accessible={true}
            style={{backgroundColor: 'red'}}>
            02/07/1987
          </Text>
          .
        </Text>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  subjectContainer: {
    backgroundColor: 'rgba(254, 255, 0, 0.75)',
    justifyContent: 'center',
  },
  subjectText: {
    fontSize: 40,
    textAlign: 'center',
  },
  row: {
    marginTop: 10,
  },
});
