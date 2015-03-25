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
#import "RCTLog.h"
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

  self.layer.position = position;
  self.layer.bounds = bounds;
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

/**
 * Responder overrides - to be deprecated.
 */
- (void)reactWillMakeFirstResponder {};
- (void)reactDidMakeFirstResponder {};
- (BOOL)reactRespondsToTouch:(UITouch *)touch
{
  return YES;
}

@end

#pragma mark - Borders

// Note: the value of this enum determines their relative zPosition
typedef NS_ENUM(NSUInteger, RCTBorderSide) {
  RCTBorderSideTop = 0,
  RCTBorderSideRight = 1,
  RCTBorderSideBottom = 2,
  RCTBorderSideLeft = 3
};

@interface RCTSingleSidedBorder : NSObject

@property (nonatomic, readwrite, assign) CGFloat width;
@property (nonatomic, readwrite, strong) UIColor *color;
@property (nonatomic, readonly, assign) RCTBorderSide side;

- (instancetype)initWithSide:(RCTBorderSide)side superlayer:(CALayer *)superlayer;

- (void)superLayerBoundsDidChange;

@end

@implementation RCTSingleSidedBorder
{
  CALayer *_borderLayer;
}

- (instancetype)initWithSide:(RCTBorderSide)side superlayer:(CALayer *)superlayer
{
  if (self = [super init]) {
    _side = side;

    _borderLayer = [CALayer layer];
    _borderLayer.delegate = self;
    _borderLayer.zPosition = INT_MAX - _side;

    [superlayer insertSublayer:_borderLayer atIndex:0];
  }
  return self;
}

- (void)dealloc
{
  _borderLayer.delegate = nil;
}

- (void)setWidth:(CGFloat)width
{
  _width = width;
  [_borderLayer setNeedsLayout];
}

- (void)setColor:(UIColor *)color
{
  _color = color;
  _borderLayer.backgroundColor = _color.CGColor;
  [_borderLayer setNeedsLayout];
}

- (void)superLayerBoundsDidChange
{
  [_borderLayer setNeedsLayout];
}

#pragma mark - CALayerDelegate

- (void)layoutSublayersOfLayer:(CALayer *)layer
{
  CGSize superlayerSize = layer.superlayer.frame.size;

  CGFloat xPosition = 0.0f;
  CGFloat yPosition = 0.0f;

  // Note: we ensure side layers are below top & bottom for snapshot test consistency

  switch (self.side) {
    case RCTBorderSideTop:
      layer.frame = CGRectMake(xPosition, yPosition, superlayerSize.width, self.width);
      break;
    case RCTBorderSideRight:
      xPosition = superlayerSize.width - self.width;
      layer.frame = CGRectMake(xPosition, yPosition, self.width, superlayerSize.height);
      [layer.superlayer insertSublayer:layer atIndex:0];
      break;
    case RCTBorderSideBottom:
      yPosition = superlayerSize.height - self.width;
      layer.frame = CGRectMake(xPosition, yPosition, superlayerSize.width, self.width);
      break;
    case RCTBorderSideLeft:
      layer.frame = CGRectMake(xPosition, yPosition, self.width, superlayerSize.height);
      [layer.superlayer insertSublayer:layer atIndex:0];
      break;
  }
}

// Disable animations for layer
- (id<CAAction>)actionForLayer:(CALayer *)layer forKey:(NSString *)event
{
  return (id)[NSNull null];
}

@end

@implementation UIView (ReactKitBorders)

- (void)reactSetBorders
{
  NSMutableDictionary *borders = objc_getAssociatedObject(self, @selector(_createOrGetBorderWithSide:));
  if (borders) {
    for (RCTSingleSidedBorder *border in [borders allValues]) {
      [border superLayerBoundsDidChange];
    }
  }
}

- (RCTSingleSidedBorder *)reactBorderTop
{
  return [self _createOrGetBorderWithSide:RCTBorderSideTop];
}

- (RCTSingleSidedBorder *)reactBorderRight
{
  return [self _createOrGetBorderWithSide:RCTBorderSideRight];
}

- (RCTSingleSidedBorder *)reactBorderBottom
{
  return [self _createOrGetBorderWithSide:RCTBorderSideBottom];
}

- (RCTSingleSidedBorder *)reactBorderLeft
{
  return [self _createOrGetBorderWithSide:RCTBorderSideLeft];
}

- (RCTSingleSidedBorder *)_createOrGetBorderWithSide:(RCTBorderSide)side
{
  NSMutableDictionary *borders = objc_getAssociatedObject(self, _cmd);
  if (!borders) {
    borders = [[NSMutableDictionary alloc] init];
    objc_setAssociatedObject(self, _cmd, borders, OBJC_ASSOCIATION_RETAIN_NONATOMIC);
  }

  RCTSingleSidedBorder *border = [borders objectForKey:@(side)];
  if (!border) {
    border = [[RCTSingleSidedBorder alloc] initWithSide:side superlayer:self.layer];
    [borders setObject:border forKey:@(side)];
  }
  return border;
}

@end
