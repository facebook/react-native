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
import {StyleSheet, View, ScrollView} from 'react-native';

function Playground() {
  return (
    <View style={styles.container}>
      <RNTesterText>
        RefreshControl size prop crash test
      </RNTesterText>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={true}
            size={80} // only crashes when actually native compiling; see pr
          />
        }
      >
        <Text>Pull to refresh - this crashes on android with size as number (indicated by TS hint) when docs specify "default" or "large"</Text>
      </ScrollView>
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
