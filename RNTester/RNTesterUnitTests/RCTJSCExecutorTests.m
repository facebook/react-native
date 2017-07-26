/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */

#import <mach/mach_time.h>

#import <XCTest/XCTest.h>

#import <React/RCTJSCExecutor.h>

@interface RCTJSCExecutorTests : XCTestCase

@end

@implementation RCTJSCExecutorTests
{
  RCTJSCExecutor *_executor;
}

- (void)setUp
{
  [super setUp];
  _executor = [RCTJSCExecutor new];
  [_executor setUp];
}

- (void)testNativeLoggingHookExceptionBehavior
{
  dispatch_semaphore_t doneSem = dispatch_semaphore_create(0);
  [_executor executeApplicationScript:[@"var x = {toString: function() { throw 1; }}; nativeLoggingHook(x);" dataUsingEncoding:NSUTF8StringEncoding]
                           sourceURL:[NSURL URLWithString:@"file://"]
                          onComplete:^(__unused id error){
                            dispatch_semaphore_signal(doneSem);
                          }];
  dispatch_semaphore_wait(doneSem, DISPATCH_TIME_FOREVER);
  [_executor invalidate];
}

@end
