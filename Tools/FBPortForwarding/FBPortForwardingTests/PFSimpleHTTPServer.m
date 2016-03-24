/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "PFSimpleHTTPServer.h"

@implementation PFSimpleHTTPServer
{
  NSData *_response;
  GCDAsyncSocket *_server;
  NSMutableArray *_clients;
}

- (instancetype)initWithPort:(NSUInteger)port response:(NSData *)data
{
  if (self = [super init]) {
    _response = [data copy];
    _clients = [NSMutableArray array];
    _server = [[GCDAsyncSocket alloc] initWithDelegate:self delegateQueue:dispatch_get_main_queue()];
    if (![_server acceptOnPort:port error:nil]) {
      return nil;
    };
  }
  return self;
}

- (void)socket:(GCDAsyncSocket *)sock didAcceptNewSocket:(GCDAsyncSocket *)newSocket
{
  [_clients addObject:newSocket];
  [newSocket readDataToData:[NSData dataWithBytes:"\r\n\r\n" length:4] withTimeout:-1 tag:0];
}

- (void)socket:(GCDAsyncSocket *)sock didReadData:(NSData *)data withTag:(long)tag
{
  NSString *headers = [NSString stringWithFormat:@"HTTP/1.1 200 OK\r\nContent-Length: %lu\r\n\r\n", (unsigned long)[_response length]];
  [sock writeData:[headers dataUsingEncoding:NSUTF8StringEncoding] withTimeout:-1 tag:0];
  [sock writeData:_response withTimeout:-1 tag:0];
  [sock disconnectAfterWriting];
}

- (void)socketDidDisconnect:(GCDAsyncSocket *)sock withError:(NSError *)err
{
  [_clients removeObject:sock];
}

@end
