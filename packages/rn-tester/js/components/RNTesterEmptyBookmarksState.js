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
import {View, Image, Text, StyleSheet} from 'react-native';

export const RNTesterEmptyBookmarksState = (): React.Node => (
  <View style={styles.emptyContainer}>
    <View style={styles.emptyContainerInner}>
      <Image
        source={require('../assets/empty.png')}
        resizeMode="contain"
        style={styles.emptyImage}
      />
      <View>
        <Text style={styles.heading}>Bookmarks are empty</Text>
        <Text style={styles.subheading}>
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

const styles = StyleSheet.create({
  emptyContainer: {
    flex: 1,
    paddingHorizontal: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
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
