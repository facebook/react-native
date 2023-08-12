/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import * as React from 'react';
import {View, StyleSheet} from 'react-native';

export function App() {
  return <View style={styles.container} />;
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    backgroundColor: 'red',
    width: '100%',
    height: '100%',
  },
  transforms: {
    transform: [
      {matrix: [0, 1, -1, 0, 0, 0]},
      {skewX: '40deg'},
      {translateX: 40},
      {translateY: 40},
      {rotate: '30deg'},
    ],
  },
});
