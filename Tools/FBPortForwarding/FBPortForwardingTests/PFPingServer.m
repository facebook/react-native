/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "PFPingServer.h"

@implementation PFPingServer
{
  GCDAsyncSocket *_server;
  NSMutableArray *_clients;
}

- (instancetype)initWithPort:(NSUInteger)port
{
  if (self = [super init]) {
    _clients = [NSMutableArray array];
    _server = [[GCDAsyncSocket alloc] initWithDelegate:self delegateQueue:dispatch_get_main_queue()];

    NSError *error;
    if (![_server acceptOnPort:port error:&error]) {
      NSLog(@"Failed to listen on port %lu: %@", (unsigned long)port, error);
      return nil;
    }
  }
  return self;
}

- (void)socket:(GCDAsyncSocket *)sock didAcceptNewSocket:(GCDAsyncSocket *)newSocket
{
  [_clients addObject:newSocket];
  [newSocket readDataWithTimeout:-1 tag:0];
}

- (void)socket:(GCDAsyncSocket *)sock didReadData:(NSData *)data withTag:(long)tag
{
  [sock writeData:data withTimeout:-1 tag:0];
  [sock readDataWithTimeout:-1 tag:0];
}

- (void)socketDidDisconnect:(GCDAsyncSocket *)sock withError:(NSError *)err
{
  [_clients removeObject:sock];
}

- (NSInteger)clientsCount
{
  return [_clients count];
}

@end
