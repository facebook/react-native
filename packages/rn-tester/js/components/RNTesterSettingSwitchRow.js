/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

import * as React from 'react';
import {StyleSheet, Switch, Text, View} from 'react-native';

type Props = {
  label: string,
  onEnable: () => void,
  onDisable: () => void,
  active: boolean,
};

const styles = StyleSheet.create({
  row: {
    padding: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});

const RNTesterSettingSwitchRow = ({
  label,
  onEnable,
  onDisable,
  active,
}: Props): React.Node => {
  return (
    <View style={styles.row}>
      <Text>{label}</Text>
      <Switch value={active} onValueChange={active ? onDisable : onEnable} />
    </View>
  );
};

export default RNTesterSettingSwitchRow;
