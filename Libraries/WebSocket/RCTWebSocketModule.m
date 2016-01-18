/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTWebSocketModule.h"

#import "RCTBridge.h"
#import "RCTEventDispatcher.h"
#import "RCTUtils.h"

@implementation RCTSRWebSocket (React)

- (NSNumber *)reactTag
{
  return objc_getAssociatedObject(self, _cmd);
}

- (void)setReactTag:(NSNumber *)reactTag
{
  objc_setAssociatedObject(self, @selector(reactTag), reactTag, OBJC_ASSOCIATION_COPY_NONATOMIC);
}

@end

@implementation RCTWebSocketModule
{
    NSMutableDictionary<NSNumber *, RCTSRWebSocket *> *_sockets;
}

RCT_EXPORT_MODULE()

@synthesize bridge = _bridge;

- (void)dealloc
{
  @synchronized(_sockets) {
    NSArray *allValues = _sockets.allValues;
    for (RCTSRWebSocket *socket in allValues) {
      socket.delegate = nil;
      [socket close];
  }}
}

RCT_EXPORT_METHOD(connect:(NSURL *)URL socketID:(nonnull NSNumber *)socketID)
{
  RCTSRWebSocket *webSocket = [[RCTSRWebSocket alloc] initWithURL:URL];
  webSocket.delegate = self;
  webSocket.reactTag = socketID;
  static dispatch_once_t once;
  
  dispatch_once(&once, ^{
    _sockets = [NSMutableDictionary new];
  });
  @synchronized(_sockets) {
    _sockets[socketID] = webSocket;
  }
  [webSocket open];
}

RCT_EXPORT_METHOD(send:(NSString *)message socketID:(nonnull NSNumber *)socketID)
{
  RCTSRWebSocket *socket = nil;
  
  @synchronized(_sockets) {
    socket = _sockets[socketID];
  }
  [socket send:message];
}

RCT_EXPORT_METHOD(close:(nonnull NSNumber *)socketID)
{
  @synchronized(_sockets) {
    [_sockets[socketID] close];
    [_sockets removeObjectForKey:socketID];
  }
}

#pragma mark - RCTSRWebSocketDelegate methods

- (void)webSocket:(RCTSRWebSocket *)webSocket didReceiveMessage:(id)message
{
  BOOL binary = [message isKindOfClass:[NSData class]];
  [_bridge.eventDispatcher sendDeviceEventWithName:@"websocketMessage" body:@{
    @"data": binary ? [message base64EncodedStringWithOptions:0] : message,
    @"type": binary ? @"binary" : @"text",
    @"id": webSocket.reactTag
  }];
}

- (void)webSocketDidOpen:(RCTSRWebSocket *)webSocket
{
  [_bridge.eventDispatcher sendDeviceEventWithName:@"websocketOpen" body:@{
    @"id": webSocket.reactTag
  }];
}

- (void)webSocket:(RCTSRWebSocket *)webSocket didFailWithError:(NSError *)error
{
  [_bridge.eventDispatcher sendDeviceEventWithName:@"websocketFailed" body:@{
    @"message":error.localizedDescription,
    @"id": webSocket.reactTag
  }];
}

- (void)webSocket:(RCTSRWebSocket *)webSocket didCloseWithCode:(NSInteger)code
           reason:(NSString *)reason wasClean:(BOOL)wasClean
{
  [_bridge.eventDispatcher sendDeviceEventWithName:@"websocketClosed" body:@{
    @"code": @(code),
    @"reason": RCTNullIfNil(reason),
    @"clean": @(wasClean),
    @"id": webSocket.reactTag
  }];
}

@end
