/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */
'use strict';

const RCTImageEditingManager = require('NativeModules').ImageEditingManager;

type ImageCropData = {
  /**
   * The top-left corner of the cropped image, specified in the original
   * image's coordinate space.
   */
  offset: {
    x: number,
    y: number,
  },
  /**
   * The size (dimensions) of the cropped image, specified in the original
   * image's coordinate space.
   */
  size: {
    width: number,
    height: number,
  },
  /**
   * (Optional) size to scale the cropped image to.
   */
  displaySize?: ?{
    width: number,
    height: number,
  },
  /**
   * (Optional) the resizing mode to use when scaling the image. If the
   * `displaySize` param is not specified, this has no effect.
   */
  resizeMode?: ?$Enum<{
    contain: string,
    cover: string,
    stretch: string,
  }>,
};

class ImageEditor {
  /**
   * Crop the image specified by the URI param. If URI points to a remote
   * image, it will be downloaded automatically. If the image cannot be
   * loaded/downloaded, the failure callback will be called.
   *
   * If the cropping process is successful, the resultant cropped image
   * will be stored in the ImageStore, and the URI returned in the success
   * callback will point to the image in the store. Remember to delete the
   * cropped image from the ImageStore when you are done with it.
   */
  static cropImage(
    uri: string,
    cropData: ImageCropData,
    success: (uri: string) => void,
    failure: (error: Object) => void,
  ) {
    RCTImageEditingManager.cropImage(uri, cropData, success, failure);
  }
}

module.exports = ImageEditor;
