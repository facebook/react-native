/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

@class RCTBridge;

typedef NS_ENUM(NSInteger, RCTFunctionType) {
  RCTFunctionTypeNormal,
  RCTFunctionTypePromise,
  RCTFunctionTypeSync,
};

static inline const char *RCTFunctionDescriptorFromType(RCTFunctionType type)
{
  switch (type) {
    case RCTFunctionTypePromise:
      return "promise";
    case RCTFunctionTypeSync:
      return "sync";
    case RCTFunctionTypeNormal:
    default:
      return "async";
  }
};

@protocol RCTBridgeMethod <NSObject>

@property (nonatomic, readonly) const char *JSMethodName;
@property (nonatomic, readonly) RCTFunctionType functionType;

- (id)invokeWithBridge:(RCTBridge *)bridge module:(id)module arguments:(NSArray *)arguments;

@end
