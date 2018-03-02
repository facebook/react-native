/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @providesModule ImagePickerIOS
 * @flow
 */
'use strict';

var RCTImagePicker = require('NativeModules').ImagePickerIOS;

var ImagePickerIOS = {
  canRecordVideos: function(callback: Function) {
    return RCTImagePicker.canRecordVideos(callback);
  },
  canUseCamera: function(callback: Function) {
    return RCTImagePicker.canUseCamera(callback);
  },
  openCameraDialog: function(config: Object, successCallback: Function, cancelCallback: Function) {
    config = {
      videoMode: false,
      ...config,
    };
    return RCTImagePicker.openCameraDialog(config, successCallback, cancelCallback);
  },
  openSelectDialog: function(config: Object, successCallback: Function, cancelCallback: Function) {
    config = {
      showImages: true,
      showVideos: false,
      ...config,
    };
    return RCTImagePicker.openSelectDialog(config, successCallback, cancelCallback);
  },
};

module.exports = ImagePickerIOS;
