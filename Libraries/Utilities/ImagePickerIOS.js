/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ImagePickerIOS
 * @flow
 */
'use strict';

var RCTImagePicker = require('NativeModules').ImagePickerIOS;

var ImagePickerIOS = {
  openSelectDialog: function(config, successCallback, cancelCallback) {
    var successCallback = successCallback || function () {};
    var cancelCallback = cancelCallback || function () {};
    var defaultConfig = {
      showImages: true,
      showVideos: false
    }

    for (var c in config) {
      defaultConfig[c] = config[c];
    }

    return RCTImagePicker.openSelectDialog(defaultConfig, successCallback, cancelCallback);
  },
};

module.exports = ImagePickerIOS;
