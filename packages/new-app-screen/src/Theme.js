/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {TextProps} from 'react-native';

import * as React from 'react';
import {Text, useColorScheme} from 'react-native';

const COLORS = {
  light: {
    background: '#f3f3f3',
    backgroundHighlight: '#cfe6ee',
    cardBackground: '#fff',
    cardOutline: '#dae1e7',
    textPrimary: '#000',
    textSecondary: '#404756',
  },
  dark: {
    background: '#000',
    backgroundHighlight: '#193c47',
    cardBackground: '#222',
    cardOutline: '#444',
    textPrimary: '#fff',
    textSecondary: '#c0c1c4',
  },
};

type Theme = {
  colors: {
    background: string,
    backgroundHighlight: string,
    cardBackground: string,
    cardOutline: string,
    textPrimary: string,
    textSecondary: string,
  },
};

export function useTheme(): Theme {
  const colorScheme = useColorScheme();

  return {
    colors: COLORS[colorScheme === 'dark' ? 'dark' : 'light'],
  };
}

export function ThemedText({
  color,
  style,
  ...props
}: {
  ...TextProps,
  color?: 'primary' | 'secondary',
}): React.Node {
  const {colors} = useTheme();

  return (
    <Text
      style={[
        {
          color:
            color === 'secondary' ? colors.textSecondary : colors.textPrimary,
        },
        style,
      ]}
      {...props}
    />
  );
}
