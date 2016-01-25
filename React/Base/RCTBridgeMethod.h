/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <Foundation/Foundation.h>

@class RCTBridge;

typedef NS_ENUM(NSUInteger, RCTFunctionType) {
  RCTFunctionTypeNormal,
  RCTFunctionTypePromise,
};

@protocol RCTBridgeMethod <NSObject>

@property (nonatomic, copy, readonly) NSString *JSMethodName;
@property (nonatomic, copy, readonly) NSDictionary *profileArgs;
@property (nonatomic, readonly) RCTFunctionType functionType;

- (void)invokeWithBridge:(RCTBridge *)bridge
                  module:(id)module
               arguments:(NSArray *)arguments;

@end
