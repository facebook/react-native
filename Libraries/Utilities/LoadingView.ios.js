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
      const loadColor = processColor('#404040');
      const refreshColor = processColor('#2584e8');
      const white = processColor('#ffffff');

      NativeDevLoadingView.showMessage(
        message,
        typeof white === 'number' ? white : null,
        type && type === 'load'
          ? typeof loadColor === 'number'
            ? loadColor
            : null
          : typeof refreshColor === 'number'
          ? refreshColor
          : null,
      );
    }
  },
  hide() {
    NativeDevLoadingView && NativeDevLoadingView.hide();
  },
};
