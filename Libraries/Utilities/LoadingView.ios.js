/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

'use strict';

import processColor from '../StyleSheet/processColor';
import NativeDevLoadingView from './NativeDevLoadingView';

module.exports = {
  showMessage(message: string, type: 'load' | 'refresh') {
    if (NativeDevLoadingView) {
      NativeDevLoadingView.showMessage(
        message,
        // Use same colors as iOS "Personal Hotspot" bar.
        processColor('#ffffff'),
        type && type === 'load'
          ? processColor('#275714')
          : processColor('#2584e8'),
      );
    }
  },
  hide() {
    NativeDevLoadingView && NativeDevLoadingView.hide();
  },
};
