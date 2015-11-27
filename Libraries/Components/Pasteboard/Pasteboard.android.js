/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule Pasteboard
 */
'use strict';


var NativePasteboard = require('react-native').NativeModules.PasteboardAndroid;

module.exports = {
  getString(callback){
    NativePasteboard.getPasteboardString(callback);
  },
  setString(content){
    NativePasteboard.setPasteboardString(content);
  }
};
