/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

import NativeActionSheetManager from '../ActionSheetIOS/NativeActionSheetManager';
import NativeShareModule from './NativeShareModule';

const processColor = require('../StyleSheet/processColor').default;
const Platform = require('../Utilities/Platform');
const invariant = require('invariant');

export type ShareContent =
  | {
      title?: string,
      url: string,
      message?: string,
    }
  | {
      title?: string,
      url?: string,
      message: string,
    };
export type ShareOptions = {
  dialogTitle?: string,
  excludedActivityTypes?: Array<string>,
  tintColor?: string,
  subject?: string,
  anchor?: number,
};

class Share {
  /**
   * Open a dialog to share text content.
   *
   * In iOS, Returns a Promise which will be invoked an object containing `action`, `activityType`.
   * If the user dismissed the dialog, the Promise will still be resolved with action being `Share.dismissedAction`
   * and all the other keys being undefined.
   *
   * In Android, Returns a Promise which always resolves with action being `Share.sharedAction`.
   *
   * ### Content
   *
   * #### iOS
   *
   *  - `url` - a URL to share
   *  - `message` - a message to share
   *
   * At least one of `URL` or `message` is required.
   *
   * #### Android
   *
   * - `title` - title of the message (optional)
   * - `message` - a message to share (often will include a URL).
   *
   * ### Options
   *
   * #### iOS
   *
   *  - `subject` - a subject to share via email
   *  - `excludedActivityTypes`
   *  - `tintColor`
   *
   * #### Android
   *
   *  - `dialogTitle`
   *
   */
  static share(
    content: ShareContent,
    options: ShareOptions = {},
  ): Promise<{action: string, activityType: ?string}> {
    invariant(
      typeof content === 'object' && content !== null,
      'Content to share must be a valid object',
    );
    invariant(
      typeof content.url === 'string' || typeof content.message === 'string',
      'At least one of URL or message is required',
    );
    invariant(
      typeof options === 'object' && options !== null,
      'Options must be a valid object',
    );

    if (Platform.OS === 'android') {
      invariant(
        NativeShareModule,
        'ShareModule should be registered on Android.',
      );
      invariant(
        content.title == null || typeof content.title === 'string',
        'Invalid title: title should be a string.',
      );

      const newContent = {
        title: content.title,
        message:
          typeof content.message === 'string' ? content.message : undefined,
      };

      return NativeShareModule.share(newContent, options.dialogTitle).then(
        result => ({
          activityType: null,
          ...result,
        }),
      );
    } else if (Platform.OS === 'ios') {
      return new Promise((resolve, reject) => {
        const tintColor = processColor(options.tintColor);

        invariant(
          tintColor == null || typeof tintColor === 'number',
          'Unexpected color given for options.tintColor',
        );

        invariant(
          NativeActionSheetManager,
          'NativeActionSheetManager is not registered on iOS, but it should be.',
        );

        NativeActionSheetManager.showShareActionSheetWithOptions(
          {
            message:
              typeof content.message === 'string' ? content.message : undefined,
            url: typeof content.url === 'string' ? content.url : undefined,
            subject: options.subject,
            tintColor: typeof tintColor === 'number' ? tintColor : undefined,
            anchor:
              typeof options.anchor === 'number' ? options.anchor : undefined,
            excludedActivityTypes: options.excludedActivityTypes,
          },
          error => reject(error),
          (success, activityType) => {
            if (success) {
              resolve({
                action: 'sharedAction',
                activityType: activityType,
              });
            } else {
              resolve({
                action: 'dismissedAction',
                activityType: null,
              });
            }
          },
        );
      });
    } else {
      return Promise.reject(new Error('Unsupported platform'));
    }
  }

  /**
   * The content was successfully shared.
   */
  static sharedAction: 'sharedAction' = 'sharedAction';

  /**
   * The dialog has been dismissed.
   * @platform ios
   */
  static dismissedAction: 'dismissedAction' = 'dismissedAction';
}

module.exports = Share;
