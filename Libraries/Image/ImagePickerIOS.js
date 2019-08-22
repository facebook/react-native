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

import NativeImagePickerIOS from './NativeImagePickerIOS';
import invariant from 'invariant';

const ImagePickerIOS = {
  canRecordVideos: function(callback: (result: boolean) => void): void {
    invariant(NativeImagePickerIOS, 'ImagePickerIOS is not available');
    return NativeImagePickerIOS.canRecordVideos(callback);
  },
  canUseCamera: function(callback: (result: boolean) => void): void {
    invariant(NativeImagePickerIOS, 'ImagePickerIOS is not available');
    return NativeImagePickerIOS.canUseCamera(callback);
  },
  openCameraDialog: function(
    config: $ReadOnly<{|
      unmirrorFrontFacingCamera?: boolean,
      videoMode?: boolean,
    |}>,
    successCallback: (imageURL: string, height: number, width: number) => void,
    cancelCallback: () => void,
  ): void {
    invariant(NativeImagePickerIOS, 'ImagePickerIOS is not available');

    var newConfig = {
      videoMode: true,
      unmirrorFrontFacingCamera: false,
    };

    if (config.videoMode != null) {
      newConfig.videoMode = config.videoMode;
    }

    if (config.unmirrorFrontFacingCamera != null) {
      newConfig.unmirrorFrontFacingCamera = config.unmirrorFrontFacingCamera;
    }

    return NativeImagePickerIOS.openCameraDialog(
      newConfig,
      successCallback,
      cancelCallback,
    );
  },
  openSelectDialog: function(
    config: $ReadOnly<{|
      showImages?: boolean,
      showVideos?: boolean,
    |}>,
    successCallback: (imageURL: string, height: number, width: number) => void,
    cancelCallback: () => void,
  ): void {
    invariant(NativeImagePickerIOS, 'ImagePickerIOS is not available');

    var newConfig = {
      showImages: true,
      showVideos: false,
    };

    if (config.showImages != null) {
      newConfig.showImages = config.showImages;
    }

    if (config.showVideos != null) {
      newConfig.showVideos = config.showVideos;
    }

    return NativeImagePickerIOS.openSelectDialog(
      newConfig,
      successCallback,
      cancelCallback,
    );
  },
};

module.exports = ImagePickerIOS;
