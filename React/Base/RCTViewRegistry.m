/*
 * Copyright (c) Facebook, Inc. and its affiliates.
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
  __weak RCTBridge *_bridge;
}

- (void)setBridge:(RCTBridge *)bridge
{
  _bridge = bridge;
}

- (void)setBridgelessComponentViewProvider:(RCTBridgelessComponentViewProvider)bridgelessComponentViewProvider
{
  _bridgelessComponentViewProvider = bridgelessComponentViewProvider;
}

- (UIView *)viewForReactTag:(NSNumber *)reactTag
{
  UIView *view = nil;

  RCTBridge *bridge = _bridge;
  if (bridge) {
    view = [bridge.uiManager viewForReactTag:reactTag];
  }

  if (view == nil && _bridgelessComponentViewProvider) {
    view = _bridgelessComponentViewProvider(reactTag);
  }

  return view;
}

@end
