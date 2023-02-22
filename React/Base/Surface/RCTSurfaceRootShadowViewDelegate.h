/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

@class RCTSurfaceRootShadowView;

@protocol RCTSurfaceRootShadowViewDelegate <NSObject>

- (void)rootShadowView:(RCTSurfaceRootShadowView *)rootShadowView didChangeIntrinsicSize:(CGSize)instrinsicSize;
- (void)rootShadowViewDidStartRendering:(RCTSurfaceRootShadowView *)rootShadowView;
- (void)rootShadowViewDidStartLayingOut:(RCTSurfaceRootShadowView *)rootShadowView;

@end

NS_ASSUME_NONNULL_END
