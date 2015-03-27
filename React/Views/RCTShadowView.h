/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <UIKit/UIKit.h>

#import "../Layout/Layout.h"

#import "RCTViewNodeProtocol.h"

@class RCTSparseArray;

typedef NS_ENUM(NSUInteger, RCTUpdateLifecycle) {
  RCTUpdateLifecycleUninitialized = 0,
  RCTUpdateLifecycleComputed,
  RCTUpdateLifecycleDirtied,
};

// TODO: is this redundact now?
typedef void (^RCTApplierBlock)(RCTSparseArray *);

/**
 * ShadowView tree mirrors RCT view tree. Every node is highly stateful.
 * 1. A node is in one of three lifecycles: uninitialized, computed, dirtied.
 * 1. RCTBridge may call any of the padding/margin/width/height/top/left setters. A setter would dirty
 *    the node and all of its ancestors.
 * 2. At the end of each Bridge transaction, we call collectUpdatedFrames:widthConstraint:heightConstraint
 *    at the root node to recursively lay out the entire hierarchy.
 * 3. If a node is "computed" and the constraint passed from above is identical to the constraint used to
 *    perform the last computation, we skip laying out the subtree entirely.
 */
@interface RCTShadowView : NSObject <RCTViewNodeProtocol>

@property (nonatomic, weak, readonly) RCTShadowView *superview;
@property (nonatomic, assign, readonly) css_node_t *cssNode;
@property (nonatomic, copy) NSString *viewName;
@property (nonatomic, assign) BOOL isBGColorExplicitlySet; // Used to propagate to children
@property (nonatomic, strong) UIColor *backgroundColor; // Used to propagate to children
@property (nonatomic, assign) RCTUpdateLifecycle layoutLifecycle;

/**
 * isNewView - Used to track the first time the view is introduced into the hierarchy.  It is initialized YES, then is
 * set to NO in RCTUIManager after the layout pass is done and all frames have been extracted to be applied to the
 * corresponding UIViews.
 */
@property (nonatomic, assign, getter=isNewView) BOOL newView;

/**
 * Position and dimensions.
 * Defaults to { 0, 0, NAN, NAN }.
 */
@property (nonatomic, assign) CGFloat top;
@property (nonatomic, assign) CGFloat left;
@property (nonatomic, assign) CGFloat bottom;
@property (nonatomic, assign) CGFloat right;

@property (nonatomic, assign) CGFloat width;
@property (nonatomic, assign) CGFloat height;
@property (nonatomic, assign) CGRect frame;

- (void)setTopLeft:(CGPoint)topLeft;
- (void)setSize:(CGSize)size;

/**
 * Border. Defaults to { 0, 0, 0, 0 }.
 */
@property (nonatomic, assign) CGFloat borderTopWidth;
@property (nonatomic, assign) CGFloat borderLeftWidth;
@property (nonatomic, assign) CGFloat borderBottomWidth;
@property (nonatomic, assign) CGFloat borderRightWidth;

- (void)setBorderWidth:(CGFloat)value;

/**
 * Margin. Defaults to { 0, 0, 0, 0 }.
 */
@property (nonatomic, assign) CGFloat marginTop;
@property (nonatomic, assign) CGFloat marginLeft;
@property (nonatomic, assign) CGFloat marginBottom;
@property (nonatomic, assign) CGFloat marginRight;

- (void)setMargin:(CGFloat)margin;
- (void)setMarginVertical:(CGFloat)margin;
- (void)setMarginHorizontal:(CGFloat)margin;

/**
 * Padding. Defaults to { 0, 0, 0, 0 }.
 */
@property (nonatomic, assign) CGFloat paddingTop;
@property (nonatomic, assign) CGFloat paddingLeft;
@property (nonatomic, assign) CGFloat paddingBottom;
@property (nonatomic, assign) CGFloat paddingRight;

- (void)setPadding:(CGFloat)padding;
- (void)setPaddingVertical:(CGFloat)padding;
- (void)setPaddingHorizontal:(CGFloat)padding;

- (UIEdgeInsets)paddingAsInsets;

/**
 * Flexbox properties. All zero/disabled by default
 */
@property (nonatomic, assign) css_flex_direction_t flexDirection;
@property (nonatomic, assign) css_justify_t justifyContent;
@property (nonatomic, assign) css_align_t alignSelf;
@property (nonatomic, assign) css_align_t alignItems;
@property (nonatomic, assign) css_position_type_t positionType;
@property (nonatomic, assign) css_wrap_type_t flexWrap;
@property (nonatomic, assign) CGFloat flex;

/**
 * Calculate property changes that need to be propagated to the view.
 * The applierBlocks set contains RCTApplierBlock functions that must be applied
 * on the main thread in order to update the view.
 */
- (void)collectUpdatedProperties:(NSMutableSet *)applierBlocks parentProperties:(NSDictionary *)parentProperties;

/**
 * Calculate all views whose frame needs updating after layout has been calculated.
 * The viewsWithNewFrame set contains the reactTags of the views that need updating.
 */
- (void)collectRootUpdatedFrames:(NSMutableSet *)viewsWithNewFrame parentConstraint:(CGSize)parentConstraint;

/**
 * The following are implementation details exposed to subclasses. Do not call them directly
 */
- (void)fillCSSNode:(css_node_t *)node;
- (void)dirtyLayout;
- (BOOL)isLayoutDirty;

// TODO: is this still needed?
- (void)dirtyPropagation;
- (BOOL)isPropagationDirty;

// TODO: move this to text node?
- (void)dirtyText;
- (BOOL)isTextDirty;
- (void)setTextComputed;

/**
 * Triggers a recalculation of the shadow view's layout.
 */
- (void)updateLayout;

/**
 * Computes the recursive offset, meaning the sum of all descendant offsets -
 * this is the sum of all positions inset from parents. This is not merely the
 * sum of `top`/`left`s, as this function uses the *actual* positions of
 * children, not the style specified positions - it computes this based on the
 * resulting layout. It does not yet compensate for native scroll view insets or
 * transforms or anchor points.
 */
- (CGRect)measureLayoutRelativeToAncestor:(RCTShadowView *)ancestor;

@end
