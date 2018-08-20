/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTShadowView.h>
#if __has_include(<ReactYoga/YGEnums.h>)
#import <ReactYoga/YGEnums.h>
#else
#import <yoga/YGEnums.h>
#endif

@interface RCTRootShadowView : RCTShadowView

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

- (void)layoutWithAffectedShadowViews:(NSHashTable<RCTShadowView *> *)affectedShadowViews;

@end
