/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

typedef void (^RCTSourceLoadBlock)(NSError *error, NSString *source);

@class RCTBridge;

@protocol RCTBridgeDelegate <NSObject>

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge;

@optional

- (NSArray *)extraModulesForBridge:(RCTBridge *)bridge;
- (void)loadSourceForBridge:(RCTBridge *)bridge withBlock:(RCTSourceLoadBlock)loadCallback;

@end
