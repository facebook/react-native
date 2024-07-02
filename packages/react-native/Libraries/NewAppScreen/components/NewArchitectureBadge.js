/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {Node} from 'react';

import View from '../../Components/View/View';
import StyleSheet from '../../StyleSheet/StyleSheet';
import Text from '../../Text/Text';
import useColorScheme from '../../Utilities/useColorScheme';
import Colors from './Colors';
import React from 'react';

const NewArchitectureBadge = (): Node => {
  const isDarkMode = useColorScheme() === 'dark';
  const hermesVersion =
    global.HermesInternal?.getRuntimeProperties?.()['OSS Release Version'] ??
    '';
  const renderer = global?.nativeFabricUIManager ? 'Fabric, New Architecture' : 'Paper';
  
  return global.HermesInternal ? (
    <View style={styles.badge}>
      <Text
        style={[
          styles.badgeText,
          {
            color: isDarkMode ? Colors.light : Colors.dark,
          },
        ]}>
        {`Engine: Hermes ${hermesVersion}`}
      </Text>
      <Text
        style={[
          styles.badgeText,
          {
            color: isDarkMode ? Colors.light : Colors.dark,
          },
        ]}>
        {`Renderer: ${renderer}`}
      </Text>
    </View>
  ) : null;
};

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: 8,
    right: 12,
  },
  badgeText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'right',
  },
});

export default NewArchitectureBadge;
