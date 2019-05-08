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
const {DevLoadingView} = require('../BatchedBridge/NativeModules');

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
