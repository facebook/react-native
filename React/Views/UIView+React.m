/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "UIView+React.h"

#import <objc/runtime.h>

#import "RCTAssert.h"
#import "RCTLog.h"
#import "RCTShadowView.h"

@interface RCTWeakObjectContainer : NSObject
@property (nonatomic, weak) id object;
@end

@implementation RCTWeakObjectContainer
@end

@implementation UIView (React)

- (NSNumber *)reactTag
{
  return objc_getAssociatedObject(self, _cmd);
}

- (void)setReactTag:(NSNumber *)reactTag
{
  objc_setAssociatedObject(self, @selector(reactTag), reactTag, OBJC_ASSOCIATION_RETAIN_NONATOMIC);
}

- (UIView *)reactSuperview
{
  return [(RCTWeakObjectContainer *)objc_getAssociatedObject(self, @selector(reactSuperview)) object];
}

- (void)setReactSuperview:(UIView *)reactSuperview
{
  RCTWeakObjectContainer *wrapper = [RCTWeakObjectContainer new];
  wrapper.object = reactSuperview;
  objc_setAssociatedObject(self, @selector(reactSuperview), wrapper, OBJC_ASSOCIATION_RETAIN_NONATOMIC);
}

#if RCT_DEV

- (RCTShadowView *)_DEBUG_reactShadowView
{
  return objc_getAssociatedObject(self, _cmd);
}

- (void)_DEBUG_setReactShadowView:(RCTShadowView *)shadowView
{
  // Use assign to avoid keeping the shadowView alive it if no longer exists
  objc_setAssociatedObject(self, @selector(_DEBUG_reactShadowView), shadowView, OBJC_ASSOCIATION_ASSIGN);
}

#endif

- (BOOL)isReactRootView
{
  return RCTIsReactRootView(self.reactTag);
}

- (NSNumber *)reactTagAtPoint:(CGPoint)point
{
  UIView *view = [self hitTest:point withEvent:nil];
  while (view && !view.reactTag) {
    view = view.superview;
  }
  return view.reactTag;
}

- (NSArray<UIView *> *)reactSubviews
{
  return objc_getAssociatedObject(self, _cmd);
}

- (void)insertReactSubview:(UIView *)subview atIndex:(NSInteger)atIndex
{
  // We access the associated object directly here in case someone overrides
  // the `reactSubviews` getter method and returns an immutable array.
  NSMutableArray *subviews = objc_getAssociatedObject(self, @selector(reactSubviews));
  if (!subviews) {
    subviews = [NSMutableArray new];
    objc_setAssociatedObject(self, @selector(reactSubviews), subviews, OBJC_ASSOCIATION_RETAIN_NONATOMIC);
  }
  [subviews insertObject:subview atIndex:atIndex];
  [subview setReactSuperview:self];
}

- (void)removeReactSubview:(UIView *)subview
{
  // We access the associated object directly here in case someone overrides
  // the `reactSubviews` getter method and returns an immutable array.
  NSMutableArray *subviews = objc_getAssociatedObject(self, @selector(reactSubviews));
  [subviews removeObject:subview];
  [subview removeFromSuperview];
  [subview setReactSuperview:nil];
}

- (NSInteger)reactZIndex
{
  return [objc_getAssociatedObject(self, _cmd) integerValue];
}

- (void)setReactZIndex:(NSInteger)reactZIndex
{
  objc_setAssociatedObject(self, @selector(reactZIndex), @(reactZIndex), OBJC_ASSOCIATION_RETAIN_NONATOMIC);
}

- (NSArray<UIView *> *)sortedReactSubviews
{
  NSArray *subviews = objc_getAssociatedObject(self, _cmd);
  if (!subviews) {
    // Check if sorting is required - in most cases it won't be
    BOOL sortingRequired = NO;
    for (UIView *subview in self.reactSubviews) {
      if (subview.reactZIndex != 0) {
        sortingRequired = YES;
        break;
      }
    }
    subviews = sortingRequired ? [self.reactSubviews sortedArrayUsingComparator:^NSComparisonResult(UIView *a, UIView *b) {
      if (a.reactZIndex > b.reactZIndex) {
        return NSOrderedDescending;
      } else {
        // ensure sorting is stable by treating equal zIndex as ascending so
        // that original order is preserved
        return NSOrderedAscending;
      }
    }] : self.reactSubviews;
    objc_setAssociatedObject(self, _cmd, subviews, OBJC_ASSOCIATION_RETAIN_NONATOMIC);
  }
  return subviews;
}

// private method, used to reset sort
- (void)clearSortedSubviews
{
  objc_setAssociatedObject(self, @selector(sortedReactSubviews), nil, OBJC_ASSOCIATION_RETAIN_NONATOMIC);
}

- (void)didUpdateReactSubviews
{
  for (UIView *subview in self.sortedReactSubviews) {
    [self addSubview:subview];
  }
}

- (void)reactSetFrame:(CGRect)frame
{
  // These frames are in terms of anchorPoint = topLeft, but internally the
  // views are anchorPoint = center for easier scale and rotation animations.
  // Convert the frame so it works with anchorPoint = center.
  CGPoint position = {CGRectGetMidX(frame), CGRectGetMidY(frame)};
  CGRect bounds = {CGPointZero, frame.size};

  // Avoid crashes due to nan coords
  if (isnan(position.x) || isnan(position.y) ||
      isnan(bounds.origin.x) || isnan(bounds.origin.y) ||
      isnan(bounds.size.width) || isnan(bounds.size.height)) {
    RCTLogError(@"Invalid layout for (%@)%@. position: %@. bounds: %@",
                self.reactTag, self, NSStringFromCGPoint(position), NSStringFromCGRect(bounds));
    return;
  }

  self.center = position;
  self.bounds = bounds;
}

- (void)reactSetInheritedBackgroundColor:(__unused UIColor *)inheritedBackgroundColor
{
  // Does nothing by default
}

- (UIViewController *)reactViewController
{
  id responder = [self nextResponder];
  while (responder) {
    if ([responder isKindOfClass:[UIViewController class]]) {
      return responder;
    }
    responder = [responder nextResponder];
  }
  return nil;
}

- (void)reactAddControllerToClosestParent:(UIViewController *)controller
{
  if (!controller.parentViewController) {
    UIView *parentView = (UIView *)self.reactSuperview;
    while (parentView) {
      if (parentView.reactViewController) {
        [parentView.reactViewController addChildViewController:controller];
        [controller didMoveToParentViewController:parentView.reactViewController];
        break;
      }
      parentView = (UIView *)parentView.reactSuperview;
    }
    return;
  }
}

/**
 * Responder overrides - to be deprecated.
 */
- (void)reactWillMakeFirstResponder {};
- (void)reactDidMakeFirstResponder {};
- (BOOL)reactRespondsToTouch:(__unused UITouch *)touch
{
  return YES;
}

#pragma mark - view clipping

/**
 * How does view clipping works?
 *
 * Each view knows if it has clipping turned on and its closest ancestor that has clipping turned on (if any). That helps with effective clipping evaluation.

 * There are four standard cases when we have to evaluate view clipping:
 * 1. a view has clipping turned off:
 *    - we have to update NCV for its complete subtree
 *    - we have to add back all clipped views
 * 2. a view has clipping turned on:
 *    - we have to update NCV for its complete subtree
 *    - we have to reclip it
 * 3. a react subview is added:
 *    - we have to set it and all its subviews NCV
 *    - if it has NVC or clipping turned on we have to reclip it
 * 4. a view is moved (new frame, tranformation, is a cell in a scrolling scrollview):
 *    - if it has NCV or clipping turned on we have to reclip it
 */

- (BOOL)rct_removesClippedSubviews
{
  return [objc_getAssociatedObject(self, @selector(rct_removesClippedSubviews)) boolValue];
}

- (void)rct_setRemovesClippedSubviews:(BOOL)removeClippedSubviews
{
  objc_setAssociatedObject(self, @selector(rct_removesClippedSubviews), @(removeClippedSubviews), OBJC_ASSOCIATION_ASSIGN);
  [self rct_updateSubviewsWithNextClippingView:removeClippedSubviews ? self : nil];
  if (removeClippedSubviews) {
    [self rct_reclip];
  }
}


/**
 * Returns a closest ancestor view which has view clipping turned on.
 * `nil` is returned if there is no such view.
 */
- (UIView *)rct_nextClippingView
{
  return [(RCTWeakObjectContainer *)objc_getAssociatedObject(self, @selector(rct_nextClippingView)) object];
}

- (void)rct_setNextClippingView:(UIView *)rct_nextClippingView
{
  RCTAssert(self != rct_nextClippingView, @"A view cannot be next clipping view for itself.");
  RCTWeakObjectContainer *wrapper = [RCTWeakObjectContainer new];
  wrapper.object = rct_nextClippingView;
  objc_setAssociatedObject(self, @selector(rct_nextClippingView), wrapper, OBJC_ASSOCIATION_RETAIN_NONATOMIC);
}

/**
 * Reevaluates clipping for itself and recursively for its subviews,
 * going as deep as the first clipped subview is.
 *
 * It works like this:
 * 1/ Is any of our ancestores already clipped? If yes lets do nothing.
 * 2/ Get clipping rect that applies here.
 * 3/ Does our bounds intersect with the rect? If no clip ourself and we are done.
 * 4/ If there is an intersection make sure we are not clipped and recurse into subviews.
 *
 * We do 1/ and 2/ in one step by retrieving "active clip rect" (see method `activeClipRect`).
 */
- (void)rct_reclip
{
  // If we are not clipping or have a view that clips us there is nothing to do.
  if (!self.rct_nextClippingView && !self.rct_removesClippedSubviews) {
    return;
  }
  // If we are currently clipped our active clipping rect would be null rect. That's why we ask for our superview's.
  // Actually it's not that simple. Clipping logic operates on uiview hierarchy. If the current view is clipped we cannot use its superview, since its nil.
  // Fortunately we can use `reactSuperview`. UI and React view hierachies doesn't have to match, but when they don't match we don't clip.
  // Therefore because this view is clipped it means its reactSuperview is the same as its (clipped) UI superview.
  UIView *clippingRectSource = self.superview ? self.superview : self.reactSuperview;
  CGRect clippingRectForSuperview = clippingRectSource ? [clippingRectSource rct_activeClippingRect] : CGRectInfinite;
  if (CGRectIsNull(clippingRectForSuperview)) {
    return;
  }

  if (!CGRectIntersectsRect(self.frame, clippingRectForSuperview)) {
    // we are clipped
    clipView(self);
  } else {
    // we are not clipped
    if (!self.superview) {
      // We need to make sure we keep zIndex ordering when adding back a clipped view.
      NSUInteger position = 0;
      for (UIView *view in self.reactSuperview.sortedReactSubviews) {
        if (view.superview) {
          position += 1;
        }
        if (view == self) {
          break;
        }
      }
      [self.reactSuperview insertSubview:self atIndex:position];
    }
    // Potential optimisation: We don't have to reevaluate clipping for subviews if the whole view was visible before and is still visible now.
    CGRect clipRect = [self convertRect:clippingRectForSuperview fromView:self.superview];
    [self rct_clipSubviewsWithAncestralClipRect:clipRect];
  }
}

/**
 * This is not the same as `reclip`, since we reevaluate clipping for all subviews at once.
 * It enables us to insert the not clipped ones into right position effectively.
 */
- (void)rct_clipSubviewsWithAncestralClipRect:(CGRect)clipRect
{
  UIView *lastSubview = nil;
  if (self.rct_removesClippedSubviews) {
    clipRect = CGRectIntersection(clipRect, self.bounds);
  }
  for (UIView *subview in self.sortedReactSubviews) {
    if (CGRectIntersectsRect(subview.frame, clipRect)) {
      if (!subview.superview) {
        if (lastSubview) {
          [self insertSubview:subview aboveSubview:lastSubview];
        } else {
          [self insertSubview:subview atIndex:0];
        }
      }
      lastSubview = subview;
      [subview rct_clipSubviewsWithAncestralClipRect:[self convertRect:clipRect toView:subview]];
    } else {
      clipView(subview);
    }
  }
}

static void clipView(UIView *view)
{
  // we are clipped
  if (view.superview) {
    // We don't clip if react hierarchy doesn't match uiview hierarchy, since we could get into inconsistent state.
    if (view.reactSuperview == view.superview) {
      [view removeFromSuperview];
    }
  }
}

/**
 * If this view is not clipped:
 * Returns a rect that is used to clip this view, in the view's coordinate space.
 * If this view has clipping turned on it's bounds are accounted for in the returned clipping rect.
 *
 * Returns CGRectNull if this view is clipped or none of its ancestors has clipping turned on.
 */
- (CGRect)rct_activeClippingRect
{
  UIView *clippingParent = self.rct_nextClippingView;
  CGRect resultRect = CGRectInfinite;

  if (clippingParent) {
    if (![self isDescendantOfView:clippingParent]) {
      return CGRectNull;
    }
    resultRect = [self convertRect:[clippingParent rct_activeClippingRect] fromView:clippingParent];
  }

  if (self.rct_removesClippedSubviews) {
    resultRect = CGRectIntersection(resultRect, self.bounds);
  }

  return resultRect;
}

/**
 * Sets the next clipping view for all subviews if they are not already being clipped, recursively.
 * Using a `nil` clipping view will result in adding clipped subviews back.
 */
- (void)rct_updateSubviewsWithNextClippingView:(UIView *)clippingView
{
  for (UIView *subview in self.sortedReactSubviews) {
    if (!clippingView) {
      [self addSubview:subview];
    }
    [subview rct_setNextClippingView:clippingView];
    // We don't have to recurse if the subview either clips itself or it already has correct next clipping view set.
    if (!subview.rct_removesClippedSubviews && !(subview.rct_nextClippingView == clippingView)) {
      [subview rct_updateSubviewsWithNextClippingView:clippingView];
    }
  }
}

@end
