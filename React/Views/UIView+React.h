/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <UIKit/UIKit.h>

@class RCTShadowView;

#import "RCTComponent.h"

//TODO: let's try to eliminate this category if possible

@interface UIView (React) <RCTComponent>

/**
 * RCTComponent interface.
 */
- (NSArray<UIView *> *)reactSubviews NS_REQUIRES_SUPER;
- (UIView *)reactSuperview NS_REQUIRES_SUPER;
- (void)insertReactSubview:(UIView *)subview atIndex:(NSInteger)atIndex NS_REQUIRES_SUPER;
- (void)removeReactSubview:(UIView *)subview NS_REQUIRES_SUPER;

/**
 * z-index, used to override sibling order in didUpdateReactSubviews.
 */
@property (nonatomic, assign) NSInteger reactZIndex;

/**
 * The reactSubviews array, sorted by zIndex. This value is cached and
 * automatically recalculated if views are added or removed.
 */
@property (nonatomic, copy, readonly) NSArray<UIView *> *sortedReactSubviews;

/**
 * Updates the subviews array based on the reactSubviews. Default behavior is
 * to insert the sortedReactSubviews into the UIView.
 */
- (void)didUpdateReactSubviews;

/**
 * Used by the UIIManager to set the view frame.
 * May be overriden to disable animation, etc.
 */
- (void)reactSetFrame:(CGRect)frame;

/**
 * Used to improve performance when compositing views with translucent content.
 */
- (void)reactSetInheritedBackgroundColor:(UIColor *)inheritedBackgroundColor;

/**
 * This method finds and returns the containing view controller for the view.
 */
- (UIViewController *)reactViewController;

/**
 * This method attaches the specified controller as a child of the
 * the owning view controller of this view. Returns NO if no view
 * controller is found (which may happen if the view is not currently
 * attached to the view hierarchy).
 */
- (void)reactAddControllerToClosestParent:(UIViewController *)controller;

/**
 * Responder overrides - to be deprecated.
 */
- (void)reactWillMakeFirstResponder;
- (void)reactDidMakeFirstResponder;
- (BOOL)reactRespondsToTouch:(UITouch *)touch;

/**
 Tools for debugging
 */
#if RCT_DEV
@property (nonatomic, strong, setter=_DEBUG_setReactShadowView:) RCTShadowView *_DEBUG_reactShadowView;
#endif

@end
