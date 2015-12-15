/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule Clipboard
 */
'use strict';

var Clipboard = require('NativeModules').Clipboard;

module.exports = {
  getString(cb){
    Clipboard.getString(cb);
  },
  setString(content){
    Clipboard.setString(content);
  }
};
