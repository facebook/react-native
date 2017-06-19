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

@class RCTBridge;
@protocol RCTPackagerClientMethod;
@protocol RCTPackagerConnectionConfig;

/**
 * Encapsulates connection to React Native packager
 */
@interface RCTPackagerConnection : NSObject

+ (instancetype)connectionForBridge:(RCTBridge *)bridge;
- (instancetype)initWithConfig:(id<RCTPackagerConnectionConfig>)config;
- (void)addHandler:(id<RCTPackagerClientMethod>)handler forMethod:(NSString *)name;

@end

#endif
