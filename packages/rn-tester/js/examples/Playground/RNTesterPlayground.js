/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {RNTesterModuleExample} from '../../types/RNTesterTypes';

import RNTesterText from '../../components/RNTesterText';
import * as React from 'react';
import {StyleSheet, View} from 'react-native';

function Playground() {
  return (
    <View style={styles.container}>
      <View style={styles.parentView}>
        <View style={styles.box1} />
      </View>

      <View style={styles.box2} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  parentView: {
    flex: 1,
    backgroundColor: "grey",
  },
  box1: {
    width: 200,
    height: 200,
    backgroundColor: "blue",
    zIndex: 1,
  },
  box2: {
    position: "absolute",
    left: 50,
    top: 50,
    width: 200,
    height: 200,
    backgroundColor: "red",
  },
});

export default ({
  title: 'Playground',
  name: 'playground',
  description: 'Test out new features and ideas.',
  render: (): React.Node => <Playground />,
}: RNTesterModuleExample);
