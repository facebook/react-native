/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

import processColor from '../StyleSheet/processColor';
import Appearance from './Appearance';
import NativeDevLoadingView from './NativeDevLoadingView';

module.exports = {
  showMessage(message: string, type: 'load' | 'refresh') {
    if (NativeDevLoadingView) {
      if (type === 'refresh') {
        const backgroundColor = processColor('#2584e8');
        const textColor = processColor('#ffffff');

        NativeDevLoadingView.showMessage(
          message,
          typeof textColor === 'number' ? textColor : null,
          typeof backgroundColor === 'number' ? backgroundColor : null,
        );
      } else if (type === 'load') {
        let backgroundColor;
        let textColor;

        if (Appearance.getColorScheme() === 'dark') {
          backgroundColor = processColor('#fafafa');
          textColor = processColor('#242526');
        } else {
          backgroundColor = processColor('#404040');
          textColor = processColor('#ffffff');
        }

        NativeDevLoadingView.showMessage(
          message,
          typeof textColor === 'number' ? textColor : null,
          typeof backgroundColor === 'number' ? backgroundColor : null,
        );
      }
    }
  },
  hide() {
    NativeDevLoadingView && NativeDevLoadingView.hide();
  },
};
