/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <UIKit/UIKit.h>
#import <XCTest/XCTest.h>

#import <FBPortForwarding-iOS/FBPortForwardingClient.h>
#import <FBPortForwarding-iOS/FBPortForwardingServer.h>

#import <FBTest/FBTestRunLoopRunning.h>

#import "PFPingClient.h"
#import "PFPingServer.h"
#import "PFSimpleHTTPServer.h"

#define PFWaitForPongNumber(n)                         \
  XCTAssertTrue(FBRunRunLoopUntilBlockIsTrue(^BOOL{    \
    return [client1.pongs count] == n;                 \
  }), @"Failed to receive pong");

@interface PFTests : XCTestCase <GCDAsyncSocketDelegate>

@end

@implementation PFTests

- (void)simpleHTTPTestWithData:(NSData *)data
{
  FBPortForwardingServer *portForwardingServer = [[FBPortForwardingServer alloc] init];
  [portForwardingServer forwardConnectionsFromPort:9701];
  [portForwardingServer listenForMultiplexingChannelOnPort:8055];

  FBPortForwardingClient *portForwardingClient = [[FBPortForwardingClient alloc] init];
  [portForwardingClient forwardConnectionsToPort:9702];
  [portForwardingClient connectToMultiplexingChannelOnPort:8055];

  PFSimpleHTTPServer *httpServer = [[PFSimpleHTTPServer alloc] initWithPort:9702 response:data];
  XCTAssertNotNil(httpServer);

  __block BOOL finished = NO;
  NSURLRequest *request = [NSURLRequest requestWithURL:[NSURL URLWithString:@"http://localhost:9701/"]];
  [NSURLConnection sendAsynchronousRequest:request
                                     queue:[NSOperationQueue mainQueue]
                         completionHandler:^(NSURLResponse *response, NSData *responseData, NSError *connectionError) {
                           XCTAssertNil(connectionError);
                           XCTAssertTrue([data isEqualToData:responseData]);
                           finished = YES;
                         }];

  XCTAssert(FBRunRunLoopWithConditionReturningPassed(&finished));
  [portForwardingServer close];
  FBRunRunLoopBarrier();
}

- (void)testProxiesHTTPRequests
{
  [self simpleHTTPTestWithData:[@"OK" dataUsingEncoding:NSUTF8StringEncoding]];
}

- (void)testLargeHTTPResponse
{
  NSMutableData *largePayload = [NSMutableData data];
  [largePayload setLength:10000000];
  char *bytes = [largePayload mutableBytes];
  for (NSUInteger i = 0; i < largePayload.length; i++) {
    bytes[i] = (char)(i % 255);
  }

  [self simpleHTTPTestWithData:largePayload];
}

- (void)testPingPong
{
  FBPortForwardingServer *portForwardingServer = [[FBPortForwardingServer alloc] init];
  [portForwardingServer forwardConnectionsFromPort:9706];
  [portForwardingServer listenForMultiplexingChannelOnPort:8055];

  FBPortForwardingClient *portForwardingClient = [[FBPortForwardingClient alloc] init];
  [portForwardingClient forwardConnectionsToPort:9705];
  [portForwardingClient connectToMultiplexingChannelOnPort:8055];

  PFPingServer *server = [[PFPingServer alloc] initWithPort:9705];
  XCTAssertNotNil(server);

  PFPingClient *client1 = [[PFPingClient alloc] init];
  [client1 connectToLocalServerOnPort:9706];

  PFPingClient *client2 = [[PFPingClient alloc] init];
  [client2 connectToLocalServerOnPort:9706];

  XCTAssertTrue(FBRunRunLoopUntilBlockIsTrue(^BOOL{
    return client1.connected && client2.connected;
  }), @"Failed to connect");

  NSData *ping = [NSData dataWithBytes:"PING" length:4];
  [client1 sendPing:ping];

  PFWaitForPongNumber(1);

  NSData *pong = client1.pongs[0];
  XCTAssert([ping isEqualToData:pong]);

  [client1 sendPing:ping];
  PFWaitForPongNumber(2);

  [client1 sendPing:ping];
  PFWaitForPongNumber(3);

  [client1 sendPing:ping];
  PFWaitForPongNumber(4);

  [client1 sendPing:ping];
  [client1 sendPing:ping];
  PFWaitForPongNumber(6);

  XCTAssertEqual(0, client2.pongs.count);

  [portForwardingServer close];
}

- (void)testDisconnectsWhenNoChannel
{
  FBPortForwardingServer *portForwardingServer = [[FBPortForwardingServer alloc] init];
  [portForwardingServer forwardConnectionsFromPort:9707];
  [portForwardingServer listenForMultiplexingChannelOnPort:8056];

  __block BOOL finished = NO;
  NSURLRequest *request = [NSURLRequest requestWithURL:[NSURL URLWithString:@"http://localhost:9707/"]];
  [NSURLConnection sendAsynchronousRequest:request
                                     queue:[NSOperationQueue mainQueue]
                         completionHandler:^(NSURLResponse *response, NSData *responseData, NSError *connectionError) {
                           XCTAssertNotNil(connectionError);
                           finished = YES;
                         }];

  NSDate *start = [NSDate date];
  XCTAssert(FBRunRunLoopWithConditionReturningPassed(&finished));
  NSTimeInterval elapsed = -[start timeIntervalSinceNow];
  XCTAssertLessThan(elapsed, 5, @"Must disconnect - no port forwarding client");

  [portForwardingServer close];
}

- (void)testWaitsForChannel
{
  FBPortForwardingServer *portForwardingServer = [[FBPortForwardingServer alloc] init];
  [portForwardingServer forwardConnectionsFromPort:9707];
  [portForwardingServer listenForMultiplexingChannelOnPort:8056];

  NSData *data = [@"OK" dataUsingEncoding:NSUTF8StringEncoding];
  PFSimpleHTTPServer *httpServer = [[PFSimpleHTTPServer alloc] initWithPort:9702 response:data];
  XCTAssertNotNil(httpServer);

  __block BOOL finished = NO;
  NSURLRequest *request = [NSURLRequest requestWithURL:[NSURL URLWithString:@"http://localhost:9707/"]];
  [NSURLConnection sendAsynchronousRequest:request
                                     queue:[NSOperationQueue mainQueue]
                         completionHandler:^(NSURLResponse *response, NSData *responseData, NSError *connectionError) {
                           XCTAssertNil(connectionError);
                           XCTAssertNotNil(responseData);
                           NSString *res = [[NSString alloc] initWithData:responseData encoding:NSUTF8StringEncoding];
                           XCTAssertEqualObjects(res, @"OK");
                           finished = YES;
                         }];

  NSDate *start = [NSDate date];
  FBRunRunLoopUntilBlockIsTrue(^BOOL{
    return [start timeIntervalSinceNow] < -0.5;
  });

  // NOTE: Establishing port forwarding connection *after* sending HTTP request
  FBPortForwardingClient *portForwardingClient = [[FBPortForwardingClient alloc] init];
  [portForwardingClient forwardConnectionsToPort:9702];
  [portForwardingClient connectToMultiplexingChannelOnPort:8056];

  XCTAssert(FBRunRunLoopWithConditionReturningPassed(&finished));
  [portForwardingServer close];
}

- (void)testDisconnectsWhenChannelConnectionLost
{
  FBPortForwardingServer *portForwardingServer = [[FBPortForwardingServer alloc] init];
  [portForwardingServer forwardConnectionsFromPort:9706];
  [portForwardingServer listenForMultiplexingChannelOnPort:8055];

  FBPortForwardingClient *portForwardingClient = [[FBPortForwardingClient alloc] init];
  [portForwardingClient forwardConnectionsToPort:9705];
  [portForwardingClient connectToMultiplexingChannelOnPort:8055];

  PFPingServer *server = [[PFPingServer alloc] initWithPort:9705];
  XCTAssertNotNil(server);

  PFPingClient *client1 = [[PFPingClient alloc] init];
  [client1 connectToLocalServerOnPort:9706];

  XCTAssertTrue(FBRunRunLoopUntilBlockIsTrue(^BOOL{
    return client1.connected;
  }), @"Failed to connect");

  [portForwardingClient close];

  XCTAssertTrue(FBRunRunLoopUntilBlockIsTrue(^BOOL{
    return !client1.connected;
  }), @"Failed to disconnect");

  XCTAssertEqual(server.clientsCount, 0);

  [portForwardingServer close];
}

@end
