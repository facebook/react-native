/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import {RNTesterThemeContext} from './RNTesterTheme';
import React from 'react';
import {StyleSheet, Text} from 'react-native';

type Props = $ReadOnly<{
  children: React.Node,
}>;

export default function RNTesterComponentTitle({children}: Props): React.Node {
  const theme = React.useContext(RNTesterThemeContext);
  return (
    <Text style={[styles.titleText, {color: theme.LabelColor}]}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  titleText: {
    fontSize: 18,
    fontWeight: '400',
  },
});
