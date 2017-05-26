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

const Platform = require('../Utilities/Platform');

const invariant = require('fbjs/lib/invariant');
const processColor = require('../StyleSheet/processColor');

const {
  ActionSheetManager,
  ShareModule
} = require('../BatchedBridge/NativeModules');

type Content = { title?: string, message: string } | { title?: string, url: string };
type Options = { dialogTitle?: string, excludeActivityTypes?: Array<string>, tintColor?: string };

class Share {

  /**
   * Open a dialog to share text content.
   *
   * In iOS, Returns a Promise which will be invoked an object containing `action`, `activityType`.
   * If the user dismissed the dialog, the Promise will still be resolved with action being `Share.dismissedAction`
   * and all the other keys being undefined.
   *
   * In Android, Returns a Promise which always be resolved with action being `Share.sharedAction`.
   *
   * ### Content
   *
   *  - `message` - a message to share
   *  - `title` - title of the message
   *
   * #### iOS
   *
   *  - `url` - an URL to share
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
   *
   */
  static share(content: Content, options: Options = {}): Promise<Object> {
    invariant(
      typeof content === 'object' && content !== null,
      'Content to share must be a valid object'
    );
    invariant(
      typeof content.url === 'string' || typeof content.message === 'string',
      'At least one of URL and message is required'
    );
    invariant(
      typeof options === 'object' && options !== null,
      'Options must be a valid object'
    );

    if (Platform.OS === 'android') {
      invariant(
        !content.title || typeof content.title === 'string',
        'Invalid title: title should be a string.'
      );
      return ShareModule.share(content, options.dialogTitle);
    } else if (Platform.OS === 'ios') {
      return new Promise((resolve, reject) => {
        ActionSheetManager.showShareActionSheetWithOptions(
          {...content, ...options, tintColor: processColor(options.tintColor)},
          (error) => reject(error),
          (success, activityType) => {
            if (success) {
              resolve({
                'action': 'sharedAction',
                'activityType': activityType
              });
            } else {
              resolve({
                'action': 'dismissedAction'
              });
            }
          }
        );
      });
    } else {
      return Promise.reject(new Error('Unsupported platform'));
    }
  }

  /**
   * The content was successfully shared.
   */
  static get sharedAction() { return 'sharedAction'; }

  /**
   * The dialog has been dismissed.
   * @platform ios
   */
  static get dismissedAction() { return 'dismissedAction'; }

}

module.exports = Share;
