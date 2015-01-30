// Copyright 2004-present Facebook. All Rights Reserved.

#import "RCTJavaScriptEventDispatcher.h"

#import "RCTBridge.h"
#import "RCTModuleIDs.h"

@implementation RCTJavaScriptEventDispatcher
{
  RCTBridge *_bridge;
}

- (instancetype)initWithBridge:(RCTBridge *)bridge
{
  if (self = [super init]) {
    _bridge = bridge;
  }
  return self;
}

- (void)sendDeviceEventWithArgs:(NSArray *)args
{
  if (!args) {
    return;
  }
  [_bridge enqueueJSCall:RCTModuleIDDeviceEventEmitter
                methodID:RCTDeviceEventEmitterEmit
                    args:args];
}

- (void)sendEventWithArgs:(NSArray *)args
{
  if (!args) {
    return;
  }
  [_bridge enqueueJSCall:RCTModuleIDReactIOSEventEmitter
                methodID:RCTEventEmitterReceiveEvent
                    args:args];
}

- (void)sendTouchesWithArgs:(NSArray *)args
{
  if (!args) {
    return;
  }
  [_bridge enqueueJSCall:RCTModuleIDReactIOSEventEmitter
                methodID:RCTEventEmitterReceiveTouches
                    args:args];
}

@end
