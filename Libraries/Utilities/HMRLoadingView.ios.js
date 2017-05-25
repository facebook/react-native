/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule HMRLoadingView
 * @flow
 */

'use strict';

const processColor = require('../StyleSheet/processColor');
const { DevLoadingView } = require('../BatchedBridge/NativeModules');

class HMRLoadingView {
  static showMessage(message: string) {
    DevLoadingView.showMessage(
      message,
      processColor('#000000'),
      processColor('#aaaaaa'),
    );
  }

  static hide() {
    DevLoadingView.hide();
  }
}

module.exports = HMRLoadingView;
