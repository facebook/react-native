/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <React/RCTShadowView.h>

@interface RCTShadowView (Layout)

#pragma mark - Computed Layout-Inferred Metrics

@property (nonatomic, readonly) UIEdgeInsets paddingAsInsets;
@property (nonatomic, readonly) UIEdgeInsets borderAsInsets;
@property (nonatomic, readonly) UIEdgeInsets compoundInsets;
@property (nonatomic, readonly) CGSize availableSize;
@property (nonatomic, readonly) CGRect contentFrame;

#pragma mark - Dirty Propagation Control

/**
 * Designated method to control dirty propagation mechanism.
 * Dirties the shadow view (and all affected shadow views, usually a superview)
 * in terms of layout.
 * The default implementation does nothing.
 */
- (void)dirtyLayout;

/**
 * Designated method to control dirty propagation mechanism.
 * Clears (makes not dirty) the shadow view.
 * The default implementation does nothing.
 */
- (void)clearLayout;

@end
