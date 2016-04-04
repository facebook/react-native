/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "PFPingClient.h"

@implementation PFPingClient
{
  GCDAsyncSocket *_client;
}

- (instancetype)init
{
  if (self = [super init]) {
    _pongs = [NSArray array];
    _client = [[GCDAsyncSocket alloc] initWithDelegate:self delegateQueue:dispatch_get_main_queue()];
  }
  return self;
}

- (BOOL)connectToLocalServerOnPort:(NSUInteger)port
{
  return [_client connectToHost:@"localhost" onPort:port error:nil];
}

- (void)sendPing:(NSData *)ping
{
  [_client writeData:ping withTimeout:-1 tag:0];
}

- (void)socket:(GCDAsyncSocket *)sock didConnectToHost:(NSString *)host port:(uint16_t)port
{
  _connected = YES;
  [_client readDataWithTimeout:-1 tag:0];
}

- (void)socket:(GCDAsyncSocket *)sock didReadData:(NSData *)data withTag:(long)tag
{
  _pongs = [_pongs arrayByAddingObject:data];
  [_client readDataWithTimeout:-1 tag:0];
}

- (void)socketDidDisconnect:(GCDAsyncSocket *)sock withError:(NSError *)err
{
  _connected = NO;
}

@end
