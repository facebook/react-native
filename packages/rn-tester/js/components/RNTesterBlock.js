/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

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
    <View style={[[styles.container], {borderColor: theme.SeparatorColor}]}>
      <View style={[styles.titleContainer]}>
        <Text style={[styles.titleText]}>{title}</Text>
        <Text
          style={[styles.descriptionText, {marginTop: description ? 10 : 0}]}>
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
    backgroundColor: 'white',
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
    color: 'black',
  },
  children: {
    paddingTop: 10,
    paddingHorizontal: 10,
    margin: 10,
  },
});

module.exports = RNTesterBlock;
