/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

const React = require('react');

const {StyleSheet, Switch, Text, View} = require('react-native');

const styles = StyleSheet.create({
  row: {
    padding: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});

export const RNTesterSettingSwitchRow = ({
  label,
  onEnable,
  onDisable,
  active,
}: $FlowFixMeProps): React.Node => {
  return (
    <View style={styles.row}>
      <Text>{label}</Text>
      <Switch
        value={active}
        onValueChange={() => {
          active ? onDisable() : onEnable();
        }}
      />
    </View>
  );
};
