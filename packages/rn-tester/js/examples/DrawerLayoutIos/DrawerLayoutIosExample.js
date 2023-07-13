/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

import React from 'react';
import {DrawerLayoutIos, View} from 'react-native';
import type {RNTesterModule} from '../../types/RNTesterTypes';
import StyleSheet from '../../../../react-native/Libraries/StyleSheet/StyleSheet';

function DrawerDefault() {
  return (
    <DrawerLayoutIos visible width={420}>
      <View style={styles.modalContainer}></View>
    </DrawerLayoutIos>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    backgroundColor: 'red',
    width: 420,
    height: 200,
  },
});

const examples = [
  {
    title: 'Default drawer',
    description: 'Show a drawer',
    render(): React.Node {
      return <DrawerDefault />;
    },
  },
];

export default ({
  framework: 'React',
  title: 'DrawerLayoutIos',
  category: 'UI',
  documentationURL: 'https://reactnative.dev/docs/drawerlayoutios',
  description: 'Drawer example.',
  examples,
}: RNTesterModule);
