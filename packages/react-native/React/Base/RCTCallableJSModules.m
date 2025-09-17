/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTBridge.h"
#import "RCTBridgeModule.h"

@implementation RCTCallableJSModules {
  RCTBridgelessJSModuleMethodInvoker _bridgelessJSModuleMethodInvoker;
#ifndef RCT_REMOVE_LEGACY_ARCH
  __weak RCTBridge *_bridge;
#endif // RCT_REMOVE_LEGACY_ARCH
}

#ifndef RCT_REMOVE_LEGACY_ARCH
- (void)setBridge:(RCTBridge *)bridge
{
  _bridge = bridge;
}
#endif // RCT_REMOVE_LEGACY_ARCH

- (void)setBridgelessJSModuleMethodInvoker:(RCTBridgelessJSModuleMethodInvoker)bridgelessJSModuleMethodInvoker
{
  _bridgelessJSModuleMethodInvoker = bridgelessJSModuleMethodInvoker;
}

- (void)invokeModule:(NSString *)moduleName method:(NSString *)methodName withArgs:(NSArray *)args
{
  [self invokeModule:moduleName method:methodName withArgs:args onComplete:NULL];
}

- (void)invokeModule:(NSString *)moduleName
              method:(NSString *)methodName
            withArgs:(NSArray *)args
          onComplete:(dispatch_block_t)onComplete
{
#ifndef RCT_REMOVE_LEGACY_ARCH
  RCTBridge *bridge = _bridge;
  if (bridge) {
    [bridge enqueueJSCall:moduleName method:methodName args:args completion:onComplete];
    return;
  }
#endif // RCT_REMOVE_LEGACY_ARCH

  if (_bridgelessJSModuleMethodInvoker) {
    _bridgelessJSModuleMethodInvoker(moduleName, methodName, args, onComplete);
  }
}

@end
