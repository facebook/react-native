/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

#import <React/RCTBridge.h>
#import <React/RCTBridgeModule.h>

NS_ASSUME_NONNULL_BEGIN

@interface RCTAccessibilityManagerSync : NSObject <RCTBridgeModule>

@property (nonatomic, assign) BOOL isVoiceOverEnabled;

@end

NS_ASSUME_NONNULL_END
