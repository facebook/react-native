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
import {StyleSheet, View, Text} from 'react-native';

function Playground() {
  return (
    <View style={styles.container}>

      <View>
        <Text>Row not cutoff</Text>
      </View>

      <View style={{ display: "flex", flexDirection: "row" }}>
        <Text>
          <View>
            <Text>Row cutoff</Text>
          </View>
        </Text>
      </View>

      <View>
        <Text>Row not cutoff</Text>
      </View>
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
