/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <Foundation/Foundation.h>

#import <React/RCTDefines.h>

#if RCT_DEV

NS_ASSUME_NONNULL_BEGIN

@class RCTBridge;
@protocol RCTPackagerClientMethod;
@protocol RCTPackagerConnectionConfig;

/**
 * Encapsulates connection to React Native packager.
 * Dispatches messages from websocket to message handlers that must implement
 * <RCTPackagerClientMethod> protocol.
 * Message dispatch is performed on the main queue, unless message handler
 * provides its own queue by overriding "methodQueue" method.
 */
@interface RCTPackagerConnection : NSObject

+ (void)checkDefaultConnectionWithCallback:(void (^)(BOOL isRunning))callback
                                     queue:(dispatch_queue_t)queue;

+ (instancetype)connectionForBridge:(RCTBridge *)bridge;
- (instancetype)initWithConfig:(id<RCTPackagerConnectionConfig>)config;
- (void)addHandler:(id<RCTPackagerClientMethod>)handler forMethod:(NSString *)name;
- (void)stop;

@end

NS_ASSUME_NONNULL_END

#endif
