/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

#import "RCTLog.h"

#pragma mark - AppDelegate utilities

/// Utility function to get the key window from the UIApplication.
/// @param application The UIApplication instance.
/// @return The key window; theoretically could be nil if there would none - which should never happen.
static UIWindow *RCTKeyWindowFromApplication(UIApplication *application)
{
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
  return application.keyWindow;
#pragma clang diagnostic pop
}

#pragma mark - SceneDelegate utilities

/// Utility function to get the key window from the UIScene.
/// @param scene The UIScene instance.
/// @return The key window; theoretically could be nil if there would none - which should never happen.
static UIWindow *RCTKeyWindowFromScene(UIScene *scene)
{
  if (![scene isKindOfClass:[UIWindowScene class]]) {
    RCTLogError(
        @"UIScene in RCTLinkingManager has not been a UIWindowScene. This should have never happened and is likely a bug.");
    return nil;
  }
  return ((UIWindowScene *)scene).keyWindow;
}

#pragma mark - RCTMultiWindowRegistry

/// Registry singleton for mapping windows to corresponding delegate instances conforming to the `RCTTurboModuleManager`
/// protocol assigned to React Native instances in those windows.
///
/// This is helpful for obtaining an `id` object that can be used as a unique token to identify the instance of React
/// Native tied to a given `UIWindow`.
///
/// For instance, it is used in some `RCTEventEmitter` + `RCTBridgeModule` classes for dispatching emitter instance
/// methods from class methods on instances tied to given `UIWindow`s (RN instances) so that a native event originating
/// from a window is emitted only to the listener related to the RN instance running in that window.
@interface RCTMultiWindowRegistry : NSObject

/// Registers a window tied to the given `id`.
/// @param window The UIWindow.
/// @param rnInstanceId A unique, stable id identifying the instance of RN running in the given window.
/// Native instance tied to the given window.
+ (void)registerWindow:(UIWindow *)window withRNInstance:(id)rnInstanceId;

/// Returns the registered `UIWindow` for a given `id` representing a unique, stable id for a React Native instance.
/// @param rnInstanceId The RN instance id to query.
/// @return The registered UIWindow, or nil if none is registered.
+ (UIWindow *)windowForRNInstance:(id)rnInstanceId;

@end
