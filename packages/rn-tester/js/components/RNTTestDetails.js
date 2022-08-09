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
import {View, Text, StyleSheet, Button, Platform} from 'react-native';
import {type RNTesterTheme} from './RNTesterTheme';

function RNTTestDetails({
  description,
  expect,
  title,
  theme,
}: {
  description?: string,
  expect?: string,
  title: string,
  theme: RNTesterTheme,
}): React.Node {
  const [collapsed, setCollapsed] = React.useState(false);

  const content = (
    <>
      {description == null ? null : (
        <View style={styles.section}>
          <Text style={styles.heading}>Description</Text>
          <Text style={styles.paragraph}>{description}</Text>
        </View>
      )}
      {expect == null ? null : (
        <View style={styles.section}>
          <Text style={styles.heading}>Expectation</Text>
          <Text style={styles.paragraph}>{expect}</Text>
        </View>
      )}
    </>
  );
  return (
    <View
      style={StyleSheet.compose(styles.container, {
        borderColor: theme.SeparatorColor,
        backgroundColor:
          Platform.OS === 'ios'
            ? theme.SystemBackgroundColor
            : theme.BackgroundColor,
      })}>
      <View style={styles.titleRow}>
        <Text
          numberOfLines={1}
          style={StyleSheet.compose(styles.title, {color: theme.LabelColor})}>
          {title}
        </Text>
        {content != null && (
          <Button
            title={collapsed ? 'Expand' : 'Collapse'}
            onPress={() => setCollapsed(!collapsed)}
            color={theme.LinkColor}
          />
        )}
      </View>
      {!collapsed ? content : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 10,
    paddingTop: 6,
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  heading: {
    fontSize: 16,
    color: 'grey',
    fontWeight: '500',
  },
  paragraph: {
    fontSize: 14,
  },
  section: {
    marginVertical: 4,
  },
  title: {
    fontSize: 18,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});

export default RNTTestDetails;
