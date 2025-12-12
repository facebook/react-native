/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTShadowView.h>
#import <yoga/YGEnums.h>

__attribute__((deprecated("This API will be removed along with the legacy architecture.")))
@interface RCTRootShadowView : RCTShadowView

/**
 * Minimum size to layout all views.
 * Defaults to CGSizeZero
 */
@property (nonatomic, assign) CGSize minimumSize;

/**
 * Available size to layout all views.
 * Defaults to {INFINITY, INFINITY}
 */
@property (nonatomic, assign) CGSize availableSize;

/**
 * Layout direction (LTR or RTL) inherited from native environment and
 * is using as a base direction value in layout engine.
 * Defaults to value inferred from current locale.
 */
@property (nonatomic, assign) YGDirection baseDirection;

- (void)layoutWithAffectedShadowViews:(NSPointerArray *)affectedShadowViews;

@end
