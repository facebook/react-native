/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

#import <React/RCTDefines.h>

/**
 * A protocol which should be conformed to in order to be notified of RN reload events. These events can be
 * created by CMD+R or dev menu during development, or anywhere the trigger is exposed to JS.
 * The listener must also register itself using the method below.
 */
@protocol RCTReloadListener
- (void)didReceiveReloadCommand;
@end

/**
 * Registers a weakly-held observer of RN reload events.
 */
RCT_EXTERN void RCTRegisterReloadCommandListener(id<RCTReloadListener> listener);

/**
 * Triggers a reload for all current listeners. Replaces [_bridge reload].
 */
RCT_EXTERN void RCTTriggerReloadCommandListeners(NSString *reason);

/**
 * This notification fires anytime RCTTriggerReloadCommandListeners() is called.
 */
RCT_EXTERN NSString *const RCTTriggerReloadCommandNotification;
RCT_EXTERN NSString *const RCTTriggerReloadCommandReasonKey;
RCT_EXTERN NSString *const RCTTriggerReloadCommandBundleURLKey;

RCT_EXTERN void RCTReloadCommandSetBundleURL(NSURL *URL);
