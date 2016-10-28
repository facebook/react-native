/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <UIKit/UIKit.h>

//Internally we reference a separate library. See https://github.com/facebook/react-native/pull/9544
#if __has_include(<CSSLayout/CSSLayout.h>)
#import <CSSLayout/CSSLayout.h>
#else
#import "CSSLayout.h"
#endif

#import "RCTComponent.h"
#import "RCTRootView.h"

@class RCTSparseArray;

typedef NS_ENUM(NSUInteger, RCTUpdateLifecycle) {
  RCTUpdateLifecycleUninitialized = 0,
  RCTUpdateLifecycleComputed,
  RCTUpdateLifecycleDirtied,
};

typedef void (^RCTApplierBlock)(NSDictionary<NSNumber *, UIView *> *viewRegistry);

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
@interface RCTShadowView : NSObject <RCTComponent>

/**
 * RCTComponent interface.
 */
- (NSArray<RCTShadowView *> *)reactSubviews NS_REQUIRES_SUPER;
- (RCTShadowView *)reactSuperview NS_REQUIRES_SUPER;
- (void)insertReactSubview:(RCTShadowView *)subview atIndex:(NSInteger)atIndex NS_REQUIRES_SUPER;
- (void)removeReactSubview:(RCTShadowView *)subview NS_REQUIRES_SUPER;

@property (nonatomic, weak, readonly) RCTShadowView *superview;
@property (nonatomic, assign, readonly) CSSNodeRef cssNode;
@property (nonatomic, copy) NSString *viewName;
@property (nonatomic, strong) UIColor *backgroundColor; // Used to propagate to children
@property (nonatomic, copy) RCTDirectEventBlock onLayout;

/**
 * isNewView - Used to track the first time the view is introduced into the hierarchy.  It is initialized YES, then is
 * set to NO in RCTUIManager after the layout pass is done and all frames have been extracted to be applied to the
 * corresponding UIViews.
 */
@property (nonatomic, assign, getter=isNewView) BOOL newView;

/**
 * isHidden - RCTUIManager uses this to determine whether or not the UIView should be hidden. Useful if the
 * ShadowView determines that its UIView will be clipped and wants to hide it.
 */
@property (nonatomic, assign, getter=isHidden) BOOL hidden;

/**
 * Position and dimensions.
 * Defaults to { 0, 0, NAN, NAN }.
 */
@property (nonatomic, assign) float top;
@property (nonatomic, assign) float left;
@property (nonatomic, assign) float bottom;
@property (nonatomic, assign) float right;

@property (nonatomic, assign) float width;
@property (nonatomic, assign) float height;

@property (nonatomic, assign) float minWidth;
@property (nonatomic, assign) float maxWidth;
@property (nonatomic, assign) float minHeight;
@property (nonatomic, assign) float maxHeight;

@property (nonatomic, assign) CGRect frame;

- (void)setTopLeft:(CGPoint)topLeft;
- (void)setSize:(CGSize)size;

/**
 * Set the natural size of the view, which is used when no explicit size is set.
 * Use UIViewNoIntrinsicMetric to ignore a dimension.
 */
- (void)setIntrinsicContentSize:(CGSize)size;

/**
 * Border. Defaults to { 0, 0, 0, 0 }.
 */
@property (nonatomic, assign) float borderWidth;
@property (nonatomic, assign) float borderTopWidth;
@property (nonatomic, assign) float borderLeftWidth;
@property (nonatomic, assign) float borderBottomWidth;
@property (nonatomic, assign) float borderRightWidth;

/**
 * Margin. Defaults to { 0, 0, 0, 0 }.
 */
@property (nonatomic, assign) float margin;
@property (nonatomic, assign) float marginVertical;
@property (nonatomic, assign) float marginHorizontal;
@property (nonatomic, assign) float marginTop;
@property (nonatomic, assign) float marginLeft;
@property (nonatomic, assign) float marginBottom;
@property (nonatomic, assign) float marginRight;

/**
 * Padding. Defaults to { 0, 0, 0, 0 }.
 */
@property (nonatomic, assign) float padding;
@property (nonatomic, assign) float paddingVertical;
@property (nonatomic, assign) float paddingHorizontal;
@property (nonatomic, assign) float paddingTop;
@property (nonatomic, assign) float paddingLeft;
@property (nonatomic, assign) float paddingBottom;
@property (nonatomic, assign) float paddingRight;

- (UIEdgeInsets)paddingAsInsets;

/**
 * Flexbox properties. All zero/disabled by default
 */
@property (nonatomic, assign) CSSFlexDirection flexDirection;
@property (nonatomic, assign) CSSJustify justifyContent;
@property (nonatomic, assign) CSSAlign alignSelf;
@property (nonatomic, assign) CSSAlign alignItems;
@property (nonatomic, assign) CSSPositionType position;
@property (nonatomic, assign) CSSWrapType flexWrap;

@property (nonatomic, assign) float flexGrow;
@property (nonatomic, assign) float flexShrink;
@property (nonatomic, assign) float flexBasis;

- (void)setFlex:(float)flex;

/**
 * z-index, used to override sibling order in the view
 */
@property (nonatomic, assign) NSInteger zIndex;

/**
 * Clipping properties
 */
@property (nonatomic, assign) CSSOverflow overflow;

/**
 * Calculate property changes that need to be propagated to the view.
 * The applierBlocks set contains RCTApplierBlock functions that must be applied
 * on the main thread in order to update the view.
 */
- (void)collectUpdatedProperties:(NSMutableSet<RCTApplierBlock> *)applierBlocks
                parentProperties:(NSDictionary<NSString *, id> *)parentProperties;

/**
 * Process the updated properties and apply them to view. Shadow view classes
 * that add additional propagating properties should override this method.
 */
- (NSDictionary<NSString *, id> *)processUpdatedProperties:(NSMutableSet<RCTApplierBlock> *)applierBlocks
                                          parentProperties:(NSDictionary<NSString *, id> *)parentProperties NS_REQUIRES_SUPER;

/**
 * Can be called by a parent on a child in order to calculate all views whose frame needs
 * updating in that branch. Adds these frames to `viewsWithNewFrame`. Useful if layout
 * enters a view where flex doesn't apply (e.g. Text) and then you want to resume flex
 * layout on a subview.
 */
- (void)collectUpdatedFrames:(NSMutableSet<RCTShadowView *> *)viewsWithNewFrame
                   withFrame:(CGRect)frame
                      hidden:(BOOL)hidden
            absolutePosition:(CGPoint)absolutePosition;

/**
 * Apply the CSS layout.
 * This method also calls `applyLayoutToChildren:` internally. The functionality
 * is split into two methods so subclasses can override `applyLayoutToChildren:`
 * while using default implementation of `applyLayoutNode:`.
 */
- (void)applyLayoutNode:(CSSNodeRef)node
      viewsWithNewFrame:(NSMutableSet<RCTShadowView *> *)viewsWithNewFrame
       absolutePosition:(CGPoint)absolutePosition NS_REQUIRES_SUPER;

/**
 * Enumerate the child nodes and tell them to apply layout.
 */
- (void)applyLayoutToChildren:(CSSNodeRef)node
            viewsWithNewFrame:(NSMutableSet<RCTShadowView *> *)viewsWithNewFrame
             absolutePosition:(CGPoint)absolutePosition;

/**
 * Return whether or not this node acts as a leaf node in the eyes of CSSLayout. For example
 * RCTShadowText has children which it does not want CSSLayout to lay out so in the eyes of
 * CSSLayout it is a leaf node.
 */
- (BOOL)isCSSLeafNode;

- (void)dirtyPropagation NS_REQUIRES_SUPER;
- (BOOL)isPropagationDirty;

- (void)dirtyText NS_REQUIRES_SUPER;
- (void)setTextComputed NS_REQUIRES_SUPER;
- (BOOL)isTextDirty;

/**
 * As described in RCTComponent protocol.
 */
- (void)didUpdateReactSubviews NS_REQUIRES_SUPER;
- (void)didSetProps:(NSArray<NSString *> *)changedProps NS_REQUIRES_SUPER;

/**
 * Computes the recursive offset, meaning the sum of all descendant offsets -
 * this is the sum of all positions inset from parents. This is not merely the
 * sum of `top`/`left`s, as this function uses the *actual* positions of
 * children, not the style specified positions - it computes this based on the
 * resulting layout. It does not yet compensate for native scroll view insets or
 * transforms or anchor points.
 */
- (CGRect)measureLayoutRelativeToAncestor:(RCTShadowView *)ancestor;

/**
 * Checks if the current shadow view is a descendant of the provided `ancestor`
 */
- (BOOL)viewIsDescendantOf:(RCTShadowView *)ancestor;

@end
