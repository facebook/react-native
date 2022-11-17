/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTBridgeModule.h>
#import <React/RCTEventDispatcherProtocol.h>
#import <React/RCTEventEmitter.h>
#import <React/RCTSurfacePresenterStub.h>
#import <React/RCTUIManager.h>
#import <React/RCTUIManagerObserverCoordinator.h>
#import <React/RCTUIManagerUtils.h>

#import "RCTValueAnimatedNode.h"

// TODO T69437152 @petetheheat - Delete this fork when Fabric ships to 100%.
// NOTE: This module is temporarily forked (see RCTNativeAnimatedTurboModule).
// When making any changes, be sure to apply them to the fork as well.
@interface RCTNativeAnimatedModule : RCTEventEmitter <
                                         RCTBridgeModule,
                                         RCTValueAnimatedNodeObserver,
                                         RCTEventDispatcherObserver,
                                         RCTUIManagerObserver,
                                         RCTSurfacePresenterObserver>

@end
