/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTDefines.h>

/**
 * RCTBridgeConstants are constants that are only used in the legacy architecture.
 * Please place constants used in the new architecture into RCTConstants.
 */
/**
 * DEPRECATED - Use RCTReloadCommand instead. This notification fires just before the bridge starts
 * processing a request to reload.
 */
RCT_EXTERN NSString *const RCTBridgeWillReloadNotification;

/**
 * This notification fires whenever a fast refresh happens.
 */
RCT_EXTERN NSString *const RCTBridgeFastRefreshNotification;

/**
 * This notification fires just before the bridge begins downloading a script
 * from the packager.
 */
RCT_EXTERN NSString *const RCTBridgeWillDownloadScriptNotification;

/**
 * This notification fires just after the bridge finishes downloading a script
 * from the packager.
 */
RCT_EXTERN NSString *const RCTBridgeDidDownloadScriptNotification;

/**
 * This notification fires right after the bridge is about to invalidate NativeModule
 * instances during teardown. Handle this notification to perform additional invalidation.
 */
RCT_EXTERN NSString *const RCTBridgeWillInvalidateModulesNotification;

/**
 * This notification fires right after the bridge finishes invalidating NativeModule
 * instances during teardown. Handle this notification to perform additional invalidation.
 */
RCT_EXTERN NSString *const RCTBridgeDidInvalidateModulesNotification;

/**
 * This notification fires right before the bridge starting invalidation process.
 * Handle this notification to perform additional invalidation.
 * The notification can be issued on any thread.
 */
RCT_EXTERN NSString *const RCTBridgeWillBeInvalidatedNotification;

/**
 * Key for the RCTSource object in the RCTBridgeDidDownloadScriptNotification
 * userInfo dictionary.
 */
RCT_EXTERN NSString *const RCTBridgeDidDownloadScriptNotificationSourceKey;

/**
 * Key for the reload reason in the RCTBridgeWillReloadNotification userInfo dictionary.
 */
RCT_EXTERN NSString *const RCTBridgeDidDownloadScriptNotificationReasonKey;

/**
 * Key for the bridge description (NSString_ in the
 * RCTBridgeDidDownloadScriptNotification userInfo dictionary.
 */
RCT_EXTERN NSString *const RCTBridgeDidDownloadScriptNotificationBridgeDescriptionKey;
