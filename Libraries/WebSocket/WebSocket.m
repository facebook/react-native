/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "WebSocket.h"
#import "RCTBridge.h"
#import "RCTEventDispatcher.h"

@implementation WebSocket {
  SRWebSocket *_webSocket;
  RCTBridge *_bridge;
  NSNumber *_socketIndex;
}


- (instancetype) initWithURLString: (NSString *)URLString
                  bridge:(RCTBridge *)bridge
             socketIndex: (NSNumber *)socketIndex
{
    if (self = [super init]) {
        _bridge = bridge;
        _socketIndex = socketIndex;
        _webSocket = [[SRWebSocket alloc] initWithURL:[NSURL URLWithString:URLString]];
        _webSocket.delegate = self;
        
        [_webSocket open];
    }
    
    return self;
}

- (void) send:(id)data {
  [_webSocket send:data];
}

- (void) close {
  [_webSocket close];
}

- (void) webSocket:(SRWebSocket *)webSocket didReceiveMessage:(id)message {
  [_bridge.eventDispatcher sendDeviceEventWithName:@"websocketMessage"
                                              body:@{@"data":message, @"id":_socketIndex}];
}

- (void)webSocketDidOpen:(SRWebSocket *)webSocket {
  [_bridge.eventDispatcher sendDeviceEventWithName:@"websocketOpen"
                                              body:@{@"id":_socketIndex}];
}

- (void) webSocket:(SRWebSocket *)webSocket didFailWithError:(NSError *)error {
  [_bridge.eventDispatcher sendDeviceEventWithName:@"websocketFailed"
                                              body:@{@"message":[error localizedDescription], @"id":_socketIndex}];
  _webSocket = nil;
}

- (void)webSocket:(SRWebSocket *)webSocket didCloseWithCode:(NSInteger)code reason:(NSString *)reason wasClean:(BOOL)wasClean {
  [_bridge.eventDispatcher sendDeviceEventWithName:@"websocketClosed"
                                              body:@{
                                                     @"code": [NSNumber numberWithInt:code],
                                                     @"reason": reason,
                                                     @"clean": [NSNumber numberWithBool:wasClean],
                                                     @"id":_socketIndex
                                                     }];
  _webSocket = nil;
}


@end
