/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import processColor from '../StyleSheet/processColor';
import {getColorScheme} from './Appearance';
import NativeDevLoadingView from './NativeDevLoadingView';

const COLOR_SCHEME = {
  dark: {
    refresh: {
      backgroundColor: '#2584e8',
      textColor: '#ffffff',
    },
    load: {
      backgroundColor: '#fafafa',
      textColor: '#242526',
    },
  },
  default: {
    refresh: {
      backgroundColor: '#2584e8',
      textColor: '#ffffff',
    },
    load: {
      backgroundColor: '#404040',
      textColor: '#ffffff',
    },
  },
};

export default {
  showMessage(message: string, type: 'load' | 'refresh') {
    if (NativeDevLoadingView) {
      const colorScheme =
        getColorScheme() === 'dark' ? COLOR_SCHEME.dark : COLOR_SCHEME.default;

      const colorSet = colorScheme[type];

      let backgroundColor;
      let textColor;

      if (colorSet) {
        backgroundColor = processColor(colorSet.backgroundColor);
        textColor = processColor(colorSet.textColor);
      }

      NativeDevLoadingView.showMessage(
        message,
        typeof textColor === 'number' ? textColor : null,
        typeof backgroundColor === 'number' ? backgroundColor : null,
      );
    }
  },
  hide() {
    NativeDevLoadingView && NativeDevLoadingView.hide();
  },
};
