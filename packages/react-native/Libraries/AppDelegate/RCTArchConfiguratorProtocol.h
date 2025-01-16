/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTConvert.h>
#import <UIKit/UIKit.h>

@protocol RCTArchConfiguratorProtocol
/// This method controls whether the `turboModules` feature of the New Architecture is turned on or off.
///
/// @note: This is required to be rendering on Fabric (i.e. on the New Architecture).
/// @return: `true` if the Turbo Native Module are enabled. Otherwise, it returns `false`.
- (BOOL)turboModuleEnabled __attribute__((deprecated("Use newArchEnabled instead")));

/// This method controls whether the App will use the Fabric renderer of the New Architecture or not.
///
/// @return: `true` if the Fabric Renderer is enabled. Otherwise, it returns `false`.
- (BOOL)fabricEnabled __attribute__((deprecated("Use newArchEnabled instead")));

/// This method controls whether React Native's new initialization layer is enabled.
///
/// @return: `true` if the new initialization layer is enabled. Otherwise returns `false`.
- (BOOL)bridgelessEnabled __attribute__((deprecated("Use newArchEnabled instead")));

/// This method controls whether React Native uses new Architecture.
///
/// @return: `true` if the new architecture is enabled. Otherwise returns `false`.
- (BOOL)newArchEnabled;
@end
