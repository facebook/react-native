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

type Props = $ReadOnly<{|
  children?: React.Node,
  title?: ?string,
  description?: ?string,
|}>;

import React, {useContext} from 'react';
import {RNTesterThemeContext} from './RNTesterTheme';
import {StyleSheet, Text, View} from 'react-native';

/** functional component for generating example blocks */
const RNTesterBlock = ({description, title, children}: Props) => {
  const theme = useContext(RNTesterThemeContext);

  let descComponent = null;
  /** generating description component if description passed */
  descComponent = (
    <Text style={[styles.descriptionText, {color: theme.LabelColor}]}>
      {description}
    </Text>
  );

  return (
    <View
      style={[
        styles.container,
        {
          borderColor: theme.BorderColor,
          backgroundColor: theme.SystemBackgroundColor,
        },
      ]}>
      <View style={[styles.titleContainer]}>
        <Text style={[styles.titleText]}>{title}</Text>
        {descComponent}
      </View>
      <View style={[styles.children, {backgroundColor: theme.BackgroundColor}]}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 0,
    borderWidth: 1,
    margin: 15,
    marginVertical: 5,
  },
  titleText: {
    fontSize: 18,
    fontFamily: 'Times New Roman',
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
    paddingVertical: 10,
    paddingHorizontal: 10,
    margin: 10,
  },
});

module.exports = RNTesterBlock;
