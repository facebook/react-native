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

import NativeHeapCapture from './NativeHeapCapture';

const HeapCapture = {
  captureHeap: function(path: string) {
    let error = null;
    try {
      global.nativeCaptureHeap(path);
      console.log('HeapCapture.captureHeap succeeded: ' + path);
    } catch (e) {
      console.log('HeapCapture.captureHeap error: ' + e.toString());
      error = e.toString();
    }
    if (NativeHeapCapture) {
      NativeHeapCapture.captureComplete(path, error);
    }
  },
};

module.exports = HeapCapture;
