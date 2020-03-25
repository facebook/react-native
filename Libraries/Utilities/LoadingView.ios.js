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
      const green = processColor('#005a00');
      const blue = processColor('#2584e8');
      const white = processColor('#ffffff');

      NativeDevLoadingView.showMessage(
        message,
        // Use same colors as iOS "Personal Hotspot" bar.
        typeof white === 'number' ? white : null,
        type && type === 'load'
          ? typeof green === 'number'
            ? green
            : null
          : typeof blue === 'number'
          ? blue
          : null,
      );
    }
  },
  hide() {
    NativeDevLoadingView && NativeDevLoadingView.hide();
  },
};
