/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */
'use strict';

const RCTImageStoreManager = require('../BatchedBridge/NativeModules')
  .ImageStoreManager;

const Platform = require('../Utilities/Platform');

const warnOnce = require('../Utilities/warnOnce');

function warnUnimplementedMethod(methodName: string): void {
  warnOnce(
    `imagestore-${methodName}`,
    `react-native: ImageStore.${methodName}() is not implemented on ${
      Platform.OS
    }`,
  );
}

class ImageStore {
  /**
   * Check if the ImageStore contains image data for the specified URI.
   * @platform ios
   */
  static hasImageForTag(uri: string, callback: (hasImage: boolean) => void) {
    if (RCTImageStoreManager.hasImageForTag) {
      RCTImageStoreManager.hasImageForTag(uri, callback);
    } else {
      warnUnimplementedMethod('hasImageForTag');
    }
  }

  /**
   * Delete an image from the ImageStore. Images are stored in memory and
   * must be manually removed when you are finished with them, otherwise they
   * will continue to use up RAM until the app is terminated. It is safe to
   * call `removeImageForTag()` without first calling `hasImageForTag()`, it
   * will simply fail silently.
   * @platform ios
   */
  static removeImageForTag(uri: string) {
    if (RCTImageStoreManager.removeImageForTag) {
      RCTImageStoreManager.removeImageForTag(uri);
    } else {
      warnUnimplementedMethod('removeImageForTag');
    }
  }

  /**
   * Stores a base64-encoded image in the ImageStore, and returns a URI that
   * can be used to access or display the image later. Images are stored in
   * memory only, and must be manually deleted when you are finished with
   * them by calling `removeImageForTag()`.
   *
   * Note that it is very inefficient to transfer large quantities of binary
   * data between JS and native code, so you should avoid calling this more
   * than necessary.
   * @platform ios
   */
  static addImageFromBase64(
    base64ImageData: string,
    success: (uri: string) => void,
    failure: (error: any) => void,
  ) {
    if (RCTImageStoreManager.addImageFromBase64) {
      RCTImageStoreManager.addImageFromBase64(
        base64ImageData,
        success,
        failure,
      );
    } else {
      warnUnimplementedMethod('addImageFromBase64');
    }
  }

  /**
   * Retrieves the base64-encoded data for an image in the ImageStore. If the
   * specified URI does not match an image in the store, the failure callback
   * will be called.
   *
   * Note that it is very inefficient to transfer large quantities of binary
   * data between JS and native code, so you should avoid calling this more
   * than necessary. To display an image in the ImageStore, you can just pass
   * the URI to an `<Image/>` component; there is no need to retrieve the
   * base64 data.
   */
  static getBase64ForTag(
    uri: string,
    success: (base64ImageData: string) => void,
    failure: (error: any) => void,
  ) {
    if (RCTImageStoreManager.getBase64ForTag) {
      RCTImageStoreManager.getBase64ForTag(uri, success, failure);
    } else {
      warnUnimplementedMethod('getBase64ForTag');
    }
  }
}

module.exports = ImageStore;
