/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

import * as React from 'react';
import {View, Image, Text, StyleSheet} from 'react-native';
import {RNTesterThemeContext} from './RNTesterTheme';

export const RNTesterEmptyBookmarksState = (): React.Node => {
  const theme = React.useContext(RNTesterThemeContext);
  return (
    <View
      style={StyleSheet.compose(styles.emptyContainer, {
        backgroundColor: theme.GroupedBackgroundColor,
      })}>
      <View style={styles.emptyContainerInner}>
        <View>
          <Text style={[styles.heading, {color: theme.LabelColor}]}>
            Bookmarks are empty
          </Text>
          <Text style={[styles.subheading, {color: theme.SecondaryLabelColor}]}>
            Please tap the{' '}
            <Image
              source={require('../assets/bookmark-outline-gray.png')}
              resizeMode="contain"
              style={styles.bookmarkIcon}
            />{' '}
            icon to bookmark examples.
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  emptyContainer: {
    flex: 1,
    paddingHorizontal: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainerInner: {
    marginTop: -150,
  },
  emptyImage: {
    maxWidth: '100%',
    height: 300,
  },
  heading: {
    fontSize: 24,
    textAlign: 'center',
  },
  subheading: {
    fontSize: 16,
    textAlign: 'center',
  },
  bookmarkIcon: {
    width: 24,
    height: 24,
    transform: [{translateY: 4}],
  },
});
