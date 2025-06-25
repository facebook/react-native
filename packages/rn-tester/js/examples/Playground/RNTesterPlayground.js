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

// No changes needed to repro, just changing a line so I can make a PR :)

import type {RNTesterModuleExample} from '../../types/RNTesterTypes';

import RNTesterText from '../../components/RNTesterText';
import * as React from 'react';
import {StyleSheet, View} from 'react-native';

function Playground() {
  return (
    <View style={styles.container}>
      <RNTesterText>
        Edit "RNTesterPlayground.js" to change this file
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
  render: (): React.Node => <Playground />,
}: RNTesterModuleExample);
