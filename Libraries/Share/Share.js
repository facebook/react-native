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
   * Open a dialog to share text content.
   * 
   * ### Content
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
  static shareText(content: Object, options?: Object): Promise<boolean> {
    invariant(
      typeof content === 'object' && content !== null,
      'Content must a valid object'
    );
    invariant(
      content.url || content.message,
      'At least one of URL and message is required'
    );
    invariant(
      !content.message || typeof content.message === 'string',
      'Invalid message: message should be a string. Was: ' + content.message
    );
    invariant(
      !content.url || typeof content.url === 'string',
      'Invalid url: url should be a string. Was: ' + content.url
    );
    invariant(
      !content.subject || typeof content.subject === 'string',
      'Invalid subject: subject should be a string. Was: ' + content.subject
    );

    if (Platform.OS === 'android') {
      let dialogTitle = typeof options === 'object' && options.dialogTitle ? options.dialogTitle : null;
      return ShareModule.shareText(content, dialogTitle);
    } else if (Platform.OS === 'ios') {
      return new Promise((resolve, reject) => {
        let actionSheetOptions = {...content, ...options};
        if (typeof options === 'object' && options.tintColor) {
          actionSheetOptions.tintColor = processColor(options.tintColor);
        }
        ActionSheetManager.showShareActionSheetWithOptions(
          actionSheetOptions,
          console.error,
          (success, activityType) => {
            if (success) {
              resolve(activityType)
            } else {
              reject()
            }
          }
        );
      });
    } else {
      console.warn('Share.shareText is not supported on this platform');
    }
  }

}

module.exports = Share;