//
//  RCTNetworkTaskTests.m
//  RNTesterUnitTests
//
//  Created by Håkon Knutzen on 28/05/2024.
//  Copyright © 2024 Facebook. All rights reserved.
//

#import <XCTest/XCTest.h>
#import <React/RCTNetworkTask.h>
#import <React/RCTURLRequestHandler.h>

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

-(void)testCanReadTaskStatus
{
  NSURL *url = [[NSURL alloc] initWithString:@"https://developers.facebook.com"];
  NSURLRequest *request = [[NSURLRequest alloc] initWithURL:url];
  dispatch_queue_t callbackQueue = dispatch_queue_create("RCTNetworkTaskTests-testCanReadTaskStatus", DISPATCH_QUEUE_SERIAL);
  id<RCTURLRequestHandler> testHandler = (id<RCTURLRequestHandler>)[[TestHandler alloc] init];
  RCTNetworkTask *task = [[RCTNetworkTask alloc] initWithRequest:request handler:testHandler callbackQueue:callbackQueue];
  XCTAssertEqual([task getNetworkTaskStatus], RCTNetworkTaskPending);
  [task start];
  XCTAssertEqual([task getNetworkTaskStatus], RCTNetworkTaskInProgress);
  [task cancel];
  XCTAssertEqual([task getNetworkTaskStatus], RCTNetworkTaskFinished);
}

@end


