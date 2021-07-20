/**
 * Copyright (c) Facebook, Inc. and its affiliates.
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
        <View style={[styles.subjectContainer, {height}]}>
          <Text
            adjustsFontSizeToFit={true}
            numberOfLines={1}
            style={styles.subjectText}>
            This is adjusting text.
          </Text>
        </View>
      </View>
      <View style={styles.row}>
        <Button onPress={() => setHeight(20)} title="Set Height to 20" />
      </View>
      <View style={styles.row}>
        <Button onPress={() => setHeight(40)} title="Set Height to 40" />
      </View>
      <View style={styles.row}>
        <Button onPress={() => setHeight(60)} title="Set Height to 60" />
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
