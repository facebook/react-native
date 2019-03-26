/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

// TODO(macOS ISS#2323203) TODO(windows ISS): this file is HMRLoadingView.ios.js in facebook's repo.  Renamed to HMRLoadingView.js since it is shared here between ios, macos, and windows.

'use strict';

const processColor = require('processColor');
const {DevLoadingView} = require('NativeModules');

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
