/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import {RNTesterThemeContext} from '../../../components/RNTesterTheme';
import * as React from 'react';
import {StyleSheet, Switch, Text, View} from 'react-native';

type ViewStyleProp = $ElementType<React.ElementConfig<typeof View>, 'style'>;

type Props = {
  value: boolean,
  onValueChange: $ElementType<
    React.ElementConfig<typeof Switch>,
    'onValueChange',
  >,
  style?: ?ViewStyleProp,
};

export default function ToggleNativeDriver({
  value,
  onValueChange,
  style,
}: Props): React.Node {
  const theme = React.useContext(RNTesterThemeContext);
  return (
    <View style={StyleSheet.compose(styles.row, style)}>
      <Text style={{color: theme.SecondaryLabelColor}}>Use Native Driver</Text>
      <Switch
        testID="toggle-use-native-driver"
        onValueChange={onValueChange}
        value={value}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
