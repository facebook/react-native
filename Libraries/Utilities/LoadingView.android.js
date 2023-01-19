/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

import ToastAndroid from '../Components/ToastAndroid/ToastAndroid';
import processColor from '../StyleSheet/processColor';
import Appearance from './Appearance';
import NativeDevLoadingView from './NativeDevLoadingView';

const TOAST_SHORT_DELAY = 2000;
let isVisible = false;

module.exports = {
  showMessage(message: string, type: 'load' | 'refresh') {
    if (NativeDevLoadingView) {
      let backgroundColor;
      let textColor;

      if (type === 'refresh') {
        backgroundColor = processColor('#2584e8');
        textColor = processColor('#ffffff');
      } else if (type === 'load') {
        if (Appearance.getColorScheme() === 'dark') {
          backgroundColor = processColor('#fafafa');
          textColor = processColor('#242526');
        } else {
          backgroundColor = processColor('#404040');
          textColor = processColor('#ffffff');
        }
      }

      NativeDevLoadingView.showMessage(
        message,
        typeof textColor === 'number' ? textColor : null,
        typeof backgroundColor === 'number' ? backgroundColor : null,
      );
    } else if (!isVisible) {
      ToastAndroid.show(message, ToastAndroid.SHORT);
      isVisible = true;
      setTimeout(() => {
        isVisible = false;
      }, TOAST_SHORT_DELAY);
    }
  },
  hide() {
    NativeDevLoadingView && NativeDevLoadingView.hide();
  },
};
