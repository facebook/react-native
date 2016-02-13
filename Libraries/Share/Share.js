/**
 * Copyright (c) 2016-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule Share
 * @flow
 */
'use strict';

const Platform = require('Platform');
const {
  ActionSheetManager,
  ShareModule
} = require('NativeModules');
const invariant = require('invariant');
const processColor = require('processColor');

class Share {
  
  /**
   * Open a dialog to share text contents.
   * 
   * ### Contents
   * 
   *  - `message` - a message to share
   *  - `url` - an URL to share. In Android, this will overwrite message
   *  - `subject` - subject of the message
   * 
   * At least one of URL and message is required.
   * 
   * ### Options
   *
   * #### iOS
   *
   * - `excludedActivityTypes`
   * - `tintColor`
   *
   * #### Android
   * 
   * - `dialogTitle`
   */
  static shareTextContent(contents: Object, options?: Object): Promise<boolean> {
    invariant(
      typeof contents === 'object' && contents !== null,
      'Contents must a valid object'
    );
    invariant(
      contents.url || contents.message,
      'At least one of URL and message is required'
    );
    for(let content in contents) {
      invariant(
        typeof content === 'string',
        'Invalid Content: should be a string. Was: ' + content
      );
    }
    return Platform.OS === 'android'
      ? ShareModule.shareTextContent(contents, typeof options === 'object' && options.dialogTitle ? options.dialogTitle : null)
      : new Promise((resolve, reject) => {
        let actionSheetOptions = {...contents, ...options};
        if(typeof options === 'object' && options.tintColor) {
          actionSheetOptions.tintColor = processColor(options.tintColor);
        }
        ActionSheetManager.showShareActionSheetWithOptions(
          actionSheetOptions,
          console.error,
          (success, activityType) => {
            if(success) {
              resolve(activityType)
            } else {
              reject()
            }
          }
        );
      });
  }

}

module.exports = Share;