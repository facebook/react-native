/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTNetworkTask.h>
#import <React/RCTURLRequestHandler.h>
#import <XCTest/XCTest.h>

@interface TestHandler<RCTURLRequestHandler> : NSObject
@end

@implementation TestHandler
- (BOOL)canHandleRequest:(NSURLRequest *)request
{
  return YES;
}
- (id)sendRequest:(NSURLRequest *)request withDelegate:(id<RCTURLRequestDelegate>)delegate
{
  return [[NSUUID UUID] UUIDString];
}
@end

@interface RCTNetworkTaskTests : XCTestCase

@end

@implementation RCTNetworkTaskTests

- (void)testCanReadTaskStatus
{
  NSURL *url = [[NSURL alloc] initWithString:@"https://developers.facebook.com"];
  NSURLRequest *request = [[NSURLRequest alloc] initWithURL:url];
  dispatch_queue_t callbackQueue =
      dispatch_queue_create("RCTNetworkTaskTests-testCanReadTaskStatus", DISPATCH_QUEUE_SERIAL);
  id<RCTURLRequestHandler> testHandler = (id<RCTURLRequestHandler>)[[TestHandler alloc] init];
  RCTNetworkTask *task = [[RCTNetworkTask alloc] initWithRequest:request
                                                         handler:testHandler
                                                   callbackQueue:callbackQueue];
  XCTAssertEqual(task.status, RCTNetworkTaskPending);
  [task start];
  XCTAssertEqual(task.status, RCTNetworkTaskInProgress);
  [task cancel];
  XCTAssertEqual(task.status, RCTNetworkTaskFinished);
}

@end
