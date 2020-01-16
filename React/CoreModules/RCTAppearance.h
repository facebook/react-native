/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

RCT_EXTERN void RCTEnableAppearancePreference(BOOL enabled);
RCT_EXTERN void RCTOverrideAppearancePreference(NSString *const);

@interface RCTAppearance : RCTEventEmitter <RCTBridgeModule>
@end
