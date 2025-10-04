/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

import RNTesterDocumentationURL from './RNTesterDocumentationURL';
import {type RNTesterTheme} from './RNTesterTheme';
import * as React from 'react';
import {Platform, StyleSheet, Text, View} from 'react-native';

export default function RNTTitleBar({
  children,
  title,
  documentationURL,
  theme,
}: {
  children?: React.Node,
  title: string,
  documentationURL?: string,
  theme: RNTesterTheme,
}): React.Node {
  return (
    <View
      style={[
        styles.header,
        Platform.select({
          android: {
            ...styles.headerAndroid,
            backgroundColor: theme.BackgroundColor,
          },
          ios: {
            ...styles.headerIOS,
            backgroundColor: theme.SystemBackgroundColor,
          },
        }),
      ]}>
      {children}
      <View style={styles.headerCenter}>
        <Text style={{...styles.title, color: theme.LabelColor}}>{title}</Text>
        {documentationURL && (
          <RNTesterDocumentationURL documentationURL={documentationURL} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  headerAndroid: {
    height: 40,
  },
  headerIOS: {
    height: 36,
    marginTop: 36,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 19,
    fontWeight: '600',
    textAlign: 'center',
  },
});
