/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "UIView+ReactKit.h"

#import <objc/runtime.h>

#import "RCTAssert.h"
#import "RCTWrapperViewController.h"

@implementation UIView (ReactKit)

- (NSNumber *)reactTag
{
  return objc_getAssociatedObject(self, _cmd);
}

- (void)setReactTag:(NSNumber *)reactTag
{
  objc_setAssociatedObject(self, @selector(reactTag), reactTag, OBJC_ASSOCIATION_COPY_NONATOMIC);
}

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

- (void)insertReactSubview:(UIView *)subview atIndex:(NSInteger)atIndex
{
  [self insertSubview:subview atIndex:atIndex];
}

- (void)removeReactSubview:(UIView *)subview
{
  RCTAssert(subview.superview == self, @"%@ is a not a subview of %@", subview, self);
  [subview removeFromSuperview];
}

- (NSArray *)reactSubviews
{
  return self.subviews;
}

- (UIView *)reactSuperview
{
  return self.superview;
}

- (UIViewController *)backingViewController
{
  id responder = [self nextResponder];
  if ([responder isKindOfClass:[RCTWrapperViewController class]]) {
    return responder;
  }
  return nil;
}

- (void)addControllerToClosestParent:(UIViewController *)controller
{
  if (!controller.parentViewController) {
    UIView *parentView = (UIView *)self.reactSuperview;
    while (parentView) {
      if (parentView.backingViewController) {
        [parentView.backingViewController addChildViewController:controller];
        [controller didMoveToParentViewController:parentView.backingViewController];
        break;
      }
      parentView = (UIView *)parentView.reactSuperview;
    }
    return;
  }
}

@end
