/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <Foundation/Foundation.h>

#import <React/RCTBridgeModule.h>

@interface RNTesterTestModule : NSObject <RCTBridgeModule>

@end

@implementation RNTesterTestModule

RCT_EXPORT_MODULE(RNTesterTestModule)

RCT_EXPORT_BLOCKING_SYNCHRONOUS_METHOD(echoString:(NSString *)input)
{
  return input;
}

RCT_EXPORT_BLOCKING_SYNCHRONOUS_METHOD(methodThatReturnsNil)
{
  return nil;
}

@end
