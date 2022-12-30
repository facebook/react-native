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

const TOAST_SHORT_DELAY = 2000;
let isVisible = false;

module.exports = {
  showMessage(message: string, type: 'load' | 'refresh') {
    if (!isVisible) {
      ToastAndroid.show(message, ToastAndroid.SHORT);
      isVisible = true;
      setTimeout(() => {
        isVisible = false;
      }, TOAST_SHORT_DELAY);
    }
  },
  hide() {},
};
