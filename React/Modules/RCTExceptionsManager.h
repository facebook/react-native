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

// NOTE: Remove these three methods and the @optional directive after updating the codebase to use only the three below
@optional
- (void)handleSoftJSExceptionWithMessage:(NSString *)message stack:(NSArray *)stack;
- (void)handleFatalJSExceptionWithMessage:(NSString *)message stack:(NSArray *)stack;
- (void)updateJSExceptionWithMessage:(NSString *)message stack:(NSArray *)stack;

- (void)handleSoftJSExceptionWithMessage:(NSString *)message stack:(NSArray *)stack exceptionId:(NSNumber *)exceptionId;
- (void)handleFatalJSExceptionWithMessage:(NSString *)message stack:(NSArray *)stack exceptionId:(NSNumber *)exceptionId;
- (void)updateJSExceptionWithMessage:(NSString *)message stack:(NSArray *)stack exceptionId:(NSNumber *)exceptionId;

@end

@interface RCTExceptionsManager : NSObject <RCTBridgeModule>

- (instancetype)initWithDelegate:(id<RCTExceptionsManagerDelegate>)delegate NS_DESIGNATED_INITIALIZER;

@property (nonatomic, assign) NSUInteger maxReloadAttempts;

@end
