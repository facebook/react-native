/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <React/RCTBridgeModule.h>
#import <React/RCTConvert.h>
#import <React/RCTEventEmitter.h>

RCT_EXTERN void RCTEnableAppearancePreference(BOOL enabled);
RCT_EXTERN void RCTOverrideAppearancePreference(NSString * /*colorSchemeOverride*/);
RCT_EXTERN void RCTUseKeyWindowForSystemStyle(BOOL useMainScreen);
RCT_EXTERN NSString *RCTCurrentOverrideAppearancePreference(void);
RCT_EXTERN NSString *RCTColorSchemePreference(UITraitCollection *traitCollection);

@interface RCTAppearance : RCTEventEmitter <RCTBridgeModule>
- (instancetype)init;
@end
