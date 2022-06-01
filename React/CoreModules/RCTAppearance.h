/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTUIKit.h> // TODO(macOS GH#774)

#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

RCT_EXTERN void RCTEnableAppearancePreference(BOOL enabled);
RCT_EXTERN void RCTOverrideAppearancePreference(NSString *const);
RCT_EXTERN NSString *RCTCurrentOverrideAppearancePreference();
#if !TARGET_OS_OSX // TODO(macOS GH#774)
RCT_EXTERN NSString *RCTColorSchemePreference(UITraitCollection *traitCollection);
#else // [TODO(macOS GH#774)
RCT_EXTERN NSString *RCTColorSchemePreference(NSAppearance *appearance);
#endif // ]TODO(macOS GH#774)

@interface RCTAppearance : RCTEventEmitter <RCTBridgeModule>
@end
