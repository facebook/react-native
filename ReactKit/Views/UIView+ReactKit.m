// Copyright 2004-present Facebook. All Rights Reserved.

#import "UIView+ReactKit.h"

#import <objc/runtime.h>

#import "RCTAssert.h"

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
  return NO;
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
  RCTAssert(subview.superview == self, @"");
  [subview removeFromSuperview];
}

- (NSArray *)reactSubviews
{
  return self.subviews;
}

@end
