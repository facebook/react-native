/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTUIKit.h> // [macOS]

#import <React/RCTBridgeModule.h>
#import <React/RCTConvert.h>
#import <React/RCTEventEmitter.h>

RCT_EXTERN void RCTEnableAppearancePreference(BOOL enabled);
RCT_EXTERN void RCTOverrideAppearancePreference(NSString *const);
RCT_EXTERN NSString *RCTCurrentOverrideAppearancePreference();
#if !TARGET_OS_OSX // [macOS]
RCT_EXTERN NSString *RCTColorSchemePreference(UITraitCollection *traitCollection);
#else // [macOS
RCT_EXTERN NSString *RCTColorSchemePreference(NSAppearance *appearance);
#endif // macOS]

@interface RCTAppearance : RCTEventEmitter <RCTBridgeModule>
@end
