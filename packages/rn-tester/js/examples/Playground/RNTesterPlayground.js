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
import {StyleSheet, View, StatusBar} from 'react-native';

function Playground() {
  return (
    <>
    <View style={styles.container}>
      <RNTesterText>
        Edit "RNTesterPlayground.js" to change this file
      </RNTesterText>
    </View>
    </>
  );
}

const StatusBarExample = () => {
  return (
    <>
    <StatusBar backgroundColor={"blue"}  barStyle={'dark-content'} />
    <Playground />
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 0,
  },
});

export default ({
  title: 'Playground',
  name: 'playground',
  description: 'Test out new features and ideas.',
  render: (): React.Node => <StatusBarExample />,
}: RNTesterModuleExample);
