/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

#import <React/RCTBridgeModule.h>

@protocol RCTExceptionsManagerDelegate <NSObject>

- (void)handleSoftJSExceptionWithMessage:(NSString *)message stack:(NSArray *)stack exceptionId:(NSNumber *)exceptionId;
- (void)handleFatalJSExceptionWithMessage:(NSString *)message stack:(NSArray *)stack exceptionId:(NSNumber *)exceptionId;

@optional
- (void)updateJSExceptionWithMessage:(NSString *)message stack:(NSArray *)stack exceptionId:(NSNumber *)exceptionId;

@end

@interface RCTExceptionsManager : NSObject <RCTBridgeModule>

- (instancetype)initWithDelegate:(id<RCTExceptionsManagerDelegate>)delegate;

- (void)reportSoftException:(NSString *)message stack:(NSArray<NSDictionary *> *)stack exceptionId:(nonnull NSNumber *)exceptionId;
- (void)reportFatalException:(NSString *)message stack:(NSArray<NSDictionary *> *)stack exceptionId:(nonnull NSNumber *)exceptionId;

@property (nonatomic, weak) id<RCTExceptionsManagerDelegate> delegate;

@property (nonatomic, assign) NSUInteger maxReloadAttempts;

@end
