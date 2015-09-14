/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <Foundation/Foundation.h>

#import "RCTBridgeModule.h"

@protocol RCTExceptionsManagerDelegate <NSObject>

- (void)handleSoftJSExceptionWithMessage:(NSString *)message stack:(NSArray *)stack;
- (void)handleFatalJSExceptionWithMessage:(NSString *)message stack:(NSArray *)stack;
- (void)updateJSExceptionWithMessage:(NSString *)message stack:(NSArray *)stack;

@end

@interface RCTExceptionsManager : NSObject <RCTBridgeModule>

- (instancetype)initWithDelegate:(id<RCTExceptionsManagerDelegate>)delegate NS_DESIGNATED_INITIALIZER;

@property (nonatomic, assign) NSUInteger maxReloadAttempts;

@end
