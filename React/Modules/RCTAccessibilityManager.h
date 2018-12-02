/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

#import <React/RCTBridge.h>
#import <React/RCTBridgeModule.h>

extern NSString *const RCTAccessibilityManagerDidUpdateMultiplierNotification; // posted when multiplier is changed

@interface RCTAccessibilityManager : NSObject <RCTBridgeModule>

@property (nonatomic, readonly) CGFloat multiplier;

/// map from UIKit categories to multipliers
@property (nonatomic, copy) NSDictionary<NSString *, NSNumber *> *multipliers;

@property (nonatomic, assign) BOOL isVoiceOverEnabled;

@end

@interface RCTBridge (RCTAccessibilityManager)

@property (nonatomic, readonly) RCTAccessibilityManager *accessibilityManager;

@end
