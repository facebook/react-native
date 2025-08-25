/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTShadowView.h>
#import <React/RCTSurfaceRootShadowViewDelegate.h>
#import <yoga/YGEnums.h>

@interface RCTSurfaceRootShadowView : RCTShadowView

@property (nonatomic, assign, readonly)
    CGSize minimumSize __deprecated_msg("This API will be removed along with the legacy architecture.");
@property (nonatomic, assign, readonly)
    CGSize maximumSize __deprecated_msg("This API will be removed along with the legacy architecture.");

- (void)setMinimumSize:(CGSize)size
           maximumSize:(CGSize)maximumSize
    __deprecated_msg("This API will be removed along with the legacy architecture.");

@property (nonatomic, assign, readonly)
    CGSize intrinsicSize __deprecated_msg("This API will be removed along with the legacy architecture.");

@property (nonatomic, weak) id<RCTSurfaceRootShadowViewDelegate> delegate __deprecated_msg(
    "This API will be removed along with the legacy architecture.");

/**
 * Layout direction (LTR or RTL) inherited from native environment and
 * is using as a base direction value in layout engine.
 * Defaults to value inferred from current locale.
 */
@property (nonatomic, assign)
    YGDirection baseDirection __deprecated_msg("This API will be removed along with the legacy architecture.");

- (void)layoutWithAffectedShadowViews:(NSPointerArray *)affectedShadowViews
    __deprecated_msg("This API will be removed along with the legacy architecture.");

@end
