/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

import * as React from 'react';
import {RNTesterThemeContext} from './RNTesterTheme';
import {StyleSheet, Text, View} from 'react-native';

type Props = $ReadOnly<{|
  children?: React.Node,
  title?: ?string,
  description?: ?string,
|}>;

const RNTesterBlock = ({description, title, children}: Props): React.Node => {
  const theme = React.useContext(RNTesterThemeContext);
  return (
    <View
      style={[
        [styles.container],
        {
          borderColor: theme.SeparatorColor,
          backgroundColor: theme.SystemBackgroundColor,
        },
      ]}>
      <View style={[styles.titleContainer]}>
        <Text style={[styles.titleText, {color: theme.LabelColor}]}>
          {title}
        </Text>
        <Text
          style={[
            styles.descriptionText,
            {color: theme.LabelColor, marginTop: description ? 10 : 0},
          ]}>
          {description}
        </Text>
      </View>
      <View style={styles.children}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 0,
    borderWidth: 1,
    marginTop: 30,
    marginHorizontal: 20,
  },
  titleText: {
    fontSize: 18,
    fontWeight: '300',
  },
  titleContainer: {
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  descriptionText: {
    fontSize: 12,
    opacity: 0.5,
  },
  children: {
    marginHorizontal: 20,
    marginVertical: 10,
  },
});

module.exports = RNTesterBlock;
