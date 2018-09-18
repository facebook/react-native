/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

const ToastAndroid = require('ToastAndroid');

const TOAST_SHORT_DELAY = 2000;

class HMRLoadingView {
  static _showing: boolean;

  static showMessage(message: string) {
    if (HMRLoadingView._showing) {
      return;
    }
    ToastAndroid.show(message, ToastAndroid.SHORT);
    HMRLoadingView._showing = true;
    setTimeout(() => {
      HMRLoadingView._showing = false;
    }, TOAST_SHORT_DELAY);
  }

  static hide() {
    // noop
  }
}

module.exports = HMRLoadingView;
