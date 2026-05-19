/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#ifndef RCT_REMOVE_LEGACY_ARCH

#import <React/RCTInvalidating.h>
#import <React/RCTRootView.h>
#import <React/RCTView.h>

@class RCTBridge;
@class RCTTouchHandler;

@interface RCTRootContentView : RCTView <RCTInvalidating>

@property (nonatomic, readonly, weak)
    RCTBridge *bridge __deprecated_msg("This API will be removed along with the legacy architecture.");
@property (nonatomic, readonly, assign)
    BOOL contentHasAppeared __deprecated_msg("This API will be removed along with the legacy architecture.");
@property (nonatomic, readonly, strong)
    RCTTouchHandler *touchHandler __deprecated_msg("This API will be removed along with the legacy architecture.");
@property (nonatomic, readonly, assign)
    CGSize availableSize __deprecated_msg("This API will be removed along with the legacy architecture.");

@property (nonatomic, assign)
    BOOL passThroughTouches __deprecated_msg("This API will be removed along with the legacy architecture.");
@property (nonatomic, assign) RCTRootViewSizeFlexibility sizeFlexibility __deprecated_msg(
    "This API will be removed along with the legacy architecture.");

- (instancetype)initWithFrame:(CGRect)frame
                       bridge:(RCTBridge *)bridge
                     reactTag:(NSNumber *)reactTag
              sizeFlexibility:(RCTRootViewSizeFlexibility)sizeFlexibility NS_DESIGNATED_INITIALIZER
    __deprecated_msg("This API will be removed along with the legacy architecture.");

@end

#endif // RCT_REMOVE_LEGACY_ARCH
