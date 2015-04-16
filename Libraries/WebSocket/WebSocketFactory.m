/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "WebSocketFactory.h"
#import "WebSocket.h"
#import "RCTBridge.h"
#import "RCTSparseArray.h"

@implementation WebSocketFactory {
    RCTSparseArray *_sockets;
    NSInteger _currentSocketId;
}

RCT_EXPORT_MODULE()

@synthesize bridge = _bridge;

- (instancetype)init {
  if ((self = [super init])) {
    _sockets = [[RCTSparseArray alloc] init];
    _currentSocketId = 0;
  }
    
  return self;
}

RCT_EXPORT_METHOD(connect:(NSString *)urlString) {
  _sockets[_currentSocketId] = [[WebSocket alloc] initWithURLString:urlString bridge:_bridge socketIndex:[NSNumber numberWithInt:_currentSocketId++]];
}

RCT_EXPORT_METHOD(send:(NSString *)message socketIndex: (NSInteger)socketIndex) {
  [_sockets[socketIndex] send:message];
}

RCT_EXPORT_METHOD(destroy:(NSInteger) socketIndex) {
  _sockets[socketIndex] = nil;
}

RCT_EXPORT_METHOD(close:(NSInteger) socketIndex) {
  [_sockets[socketIndex] close];
}

@end
