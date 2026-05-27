/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTBridgeConstants.h"

NSString *const RCTBridgeWillReloadNotification = @"RCTBridgeWillReloadNotification";
NSString *const RCTBridgeFastRefreshNotification = @"RCTBridgeFastRefreshNotification";
NSString *const RCTBridgeWillDownloadScriptNotification = @"RCTBridgeWillDownloadScriptNotification";
NSString *const RCTBridgeDidDownloadScriptNotification = @"RCTBridgeDidDownloadScriptNotification";
NSString *const RCTBridgeWillInvalidateModulesNotification = @"RCTBridgeWillInvalidateModulesNotification";
NSString *const RCTBridgeDidInvalidateModulesNotification = @"RCTBridgeDidInvalidateModulesNotification";
NSString *const RCTBridgeWillBeInvalidatedNotification = @"RCTBridgeWillBeInvalidatedNotification";
NSString *const RCTBridgeDidDownloadScriptNotificationSourceKey = @"source";
NSString *const RCTBridgeDidDownloadScriptNotificationBridgeDescriptionKey = @"bridgeDescription";
