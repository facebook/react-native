// Copyright 2004-present Facebook. All Rights Reserved.

#import <Foundation/Foundation.h>

#import "RCTBridgeModule.h"

@protocol RCTExceptionsManagerDelegate <NSObject>

- (void)unhandledJSExceptionWithMessage:(NSString *)message stack:(NSArray *)stack;

@end

@interface RCTExceptionsManager : NSObject <RCTBridgeModule>

- (instancetype)initWithDelegate:(id<RCTExceptionsManagerDelegate>)delegate NS_DESIGNATED_INITIALIZER;

@end
