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
const invariant = require('fbjs/lib/invariant');
const processColor = require('processColor');

type Content = { title: string, message: string } | { title: string, url: string };
type Options = { dialogTitle?: string, excludeActivityTypes?: Array<string>, tintColor?: string };

class Share {
  
  /**
   * Open a dialog to share text content.
   * 
   * ### Content
   * 
   *  - `message` - a message to share
   *  - `url` - an URL to share. In Android, this will overwrite message
   *  - `title` - title of the message
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
  static share(content: Content, options: ?Options): Promise<boolean> {
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
      !content.title || typeof content.title === 'string',
      'Invalid title: title should be a string. Was: ' + content.title
    );

    if (Platform.OS === 'android') {
      let dialogTitle = typeof options === 'object' && options.dialogTitle ? options.dialogTitle : null;
      return ShareModule.share(content, dialogTitle);
    } else if (Platform.OS === 'ios') {
      return new Promise((resolve, reject) => {
        let actionSheetOptions = {...content, ...options};
        if (typeof options === 'object' && options.tintColor) {
          actionSheetOptions.tintColor = processColor(options.tintColor);
        }
        ActionSheetManager.showShareActionSheetWithOptions(
          actionSheetOptions,
          (error) => {
            reject(new Error(error.message))
          },
          (success, activityType) => {
            if (success) {
              resolve({
                'activityType': activityType
              })
            } else {
              reject(new Error('User canceled'))
            }
          }
        );
      });
    } else {
      console.warn('Share.share is not supported on this platform');
      return Promise.reject();
    }
  }

}

module.exports = Share;