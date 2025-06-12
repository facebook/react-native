/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTSurfacePresenterStub.h>
#import <React/RCTUIManager.h>

#import "RCTBridge.h"
#import "RCTBridgeModule.h"

@implementation RCTViewRegistry {
  RCTBridgelessComponentViewProvider _bridgelessComponentViewProvider;
#ifndef RCT_FIT_RM_OLD_RUNTIME
  __weak RCTBridge *_bridge;
#endif // RCT_FIT_RM_OLD_RUNTIME
}

#ifndef RCT_FIT_RM_OLD_RUNTIME
- (void)setBridge:(RCTBridge *)bridge
{
  _bridge = bridge;
}
#endif // RCT_FIT_RM_OLD_RUNTIME

- (void)setBridgelessComponentViewProvider:(RCTBridgelessComponentViewProvider)bridgelessComponentViewProvider
{
  _bridgelessComponentViewProvider = bridgelessComponentViewProvider;
}

- (UIView *)viewForReactTag:(NSNumber *)reactTag
{
  UIView *view = nil;

#ifndef RCT_FIT_RM_OLD_RUNTIME
  RCTBridge *bridge = _bridge;
  if (bridge) {
    view = [bridge.uiManager viewForReactTag:reactTag];
  }
#endif // RCT_FIT_RM_OLD_RUNTIME

  if (view == nil && _bridgelessComponentViewProvider) {
    view = _bridgelessComponentViewProvider(reactTag);
  }

  return view;
}

- (void)addUIBlock:(RCTViewRegistryUIBlock)block
{
  if (!block) {
    return;
  }

  __weak __typeof(self) weakSelf = self;
#ifndef RCT_FIT_RM_OLD_RUNTIME
  if (_bridge) {
    [_bridge.uiManager addUIBlock:^(RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
      __typeof(self) strongSelf = weakSelf;
      if (strongSelf) {
        block(strongSelf);
      }
    }];
    return;
  }
#endif

  RCTExecuteOnMainQueue(^{
    __typeof(self) strongSelf = weakSelf;
    if (strongSelf) {
      block(strongSelf);
    }
  }); // RCT_FIT_RM_OLD_RUNTIME
}

@end
