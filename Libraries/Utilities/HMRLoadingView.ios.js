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

const processColor = require('../StyleSheet/processColor');
import NativeDevLoadingView from './NativeDevLoadingView';

class HMRLoadingView {
  static showMessage(message: string) {
    if (NativeDevLoadingView != null) {
      NativeDevLoadingView.showMessage(
        message,
        // Use same colors as iOS "Personal Hotspot" bar.
        processColor('#ffffff'),
        processColor('#2584e8'),
      );
    }
  }

  static hide() {
    if (NativeDevLoadingView != null) {
      NativeDevLoadingView.hide();
    }
  }
}

module.exports = HMRLoadingView;
