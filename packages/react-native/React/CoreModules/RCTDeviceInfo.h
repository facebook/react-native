/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <React/RCTBridge.h>

@interface RCTDeviceInfo : NSObject <RCTBridgeModule>

- (instancetype)initWithDimensionsProvider:(NSDictionary * (^)(void))dimensionsProvider;

@end
