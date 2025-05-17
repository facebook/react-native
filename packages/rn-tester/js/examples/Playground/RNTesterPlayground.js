/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 * @oncall react_native
 */

import type {RNTesterModuleExample} from '../../types/RNTesterTypes';

import RNTesterText from '../../components/RNTesterText';
import * as React from 'react';
import {Dimensions, StyleSheet, View} from 'react-native';

function Playground() {
  const screenWithoutStatusBar = Dimensions.get('window').height;
  const screenWithStatusBar = Dimensions.get('screen').height;
  return (
    <View style={styles.container}>
      <RNTesterText>
        {`Dimensions.get('window').height: ${screenWithoutStatusBar}`}
        {'\n'}
        {`Dimensions.get('screen').height: ${screenWithStatusBar}`}
        {'\n\n'}
        {'Note these two should not be equal on iOS devices with a status bar.'}
      </RNTesterText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 10,
  },
});

export default ({
  title: 'Playground',
  name: 'playground',
  description: 'Test out new features and ideas.',
  render: (): React.Node => <Playground />,
}: RNTesterModuleExample);
