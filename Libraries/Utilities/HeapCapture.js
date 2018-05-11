/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

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
    require('NativeModules').JSCHeapCapture.captureComplete(path, error);
  },
};

module.exports = HeapCapture;
