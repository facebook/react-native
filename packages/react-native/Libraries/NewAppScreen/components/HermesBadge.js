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

type HermesBadgeProps = {
  badgeTopMargin?: number,
};
const HermesBadge = ({badgeTopMargin = 8}: HermesBadgeProps): Node => {
  const isDarkMode = useColorScheme() === 'dark';

  const badgeStyle = {
    position: 'absolute',
    right: 12,
    top: badgeTopMargin,
  };

  const version =
    global.HermesInternal?.getRuntimeProperties?.()['OSS Release Version'] ??
    '';

  return global.HermesInternal ? (
    <View style={badgeStyle}>
      <Text
        style={[
          styles.badgeText,
          {
            color: isDarkMode ? Colors.light : Colors.dark,
          },
        ]}>
        {`Engine: Hermes ${version}`}
      </Text>
    </View>
  ) : null;
};

const styles = StyleSheet.create({
  badgeText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'right',
  },
});

export default HermesBadge;
