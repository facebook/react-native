// Copyright 2004-present Facebook. All Rights Reserved.

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
