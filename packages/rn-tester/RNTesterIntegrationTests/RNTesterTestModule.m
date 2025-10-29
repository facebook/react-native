/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

#import <React/RCTBridgeModule.h>

@interface RNTesterTestModule : NSObject <RCTBridgeModule>

@end

@implementation RNTesterTestModule

RCT_EXPORT_MODULE(RNTesterTestModule)

RCT_EXPORT_BLOCKING_SYNCHRONOUS_METHOD(echoString : (NSString *)input)
{
  return input;
}

RCT_EXPORT_BLOCKING_SYNCHRONOUS_METHOD(methodThatReturnsNil)
{
  return nil;
}

RCT_EXPORT_BLOCKING_SYNCHRONOUS_METHOD(
    methodThatCallsCallbackWithString : (NSString *)input callback : (RCTResponseSenderBlock)callback)
{
  callback(@[ input ]);
  return nil;
}

@end
