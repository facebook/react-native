/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTRootContentView.h"

#import "RCTBridge.h"
#import "RCTPerformanceLogger.h"
#import "RCTRootView.h"
#import "RCTRootViewInternal.h"
#import "RCTTouchHandler.h"
#import "RCTUIManager.h"
#import "UIView+React.h"

@implementation RCTRootContentView
{
  __weak RCTBridge *_bridge;
  UIColor *_backgroundColor;
}

- (instancetype)initWithFrame:(CGRect)frame
                       bridge:(RCTBridge *)bridge
                     reactTag:(NSNumber *)reactTag
               sizeFlexiblity:(RCTRootViewSizeFlexibility)sizeFlexibility
{
  if ((self = [super initWithFrame:frame])) {
    _bridge = bridge;
    self.reactTag = reactTag;
    _sizeFlexibility = sizeFlexibility;
    _touchHandler = [[RCTTouchHandler alloc] initWithBridge:_bridge];
    [_touchHandler attachToView:self];
    [_bridge.uiManager registerRootView:self];
    self.layer.backgroundColor = NULL;
  }
  return self;
}

RCT_NOT_IMPLEMENTED(-(instancetype)initWithFrame:(CGRect)frame)
RCT_NOT_IMPLEMENTED(-(instancetype)initWithCoder:(nonnull NSCoder *)aDecoder)

- (void)layoutSubviews
{
  [super layoutSubviews];
  [self updateAvailableSize];
}

- (void)insertReactSubview:(UIView *)subview atIndex:(NSInteger)atIndex
{
  [super insertReactSubview:subview atIndex:atIndex];
  [_bridge.performanceLogger markStopForTag:RCTPLTTI];
  dispatch_async(dispatch_get_main_queue(), ^{
    if (!self->_contentHasAppeared) {
      self->_contentHasAppeared = YES;
      [[NSNotificationCenter defaultCenter] postNotificationName:RCTContentDidAppearNotification
                                                          object:self.superview];
    }
  });
}

- (void)setSizeFlexibility:(RCTRootViewSizeFlexibility)sizeFlexibility
{
  if (_sizeFlexibility == sizeFlexibility) {
    return;
  }

  _sizeFlexibility = sizeFlexibility;
  [self setNeedsLayout];
}

- (CGSize)availableSize
{
  CGSize size = self.bounds.size;
  return CGSizeMake(
      _sizeFlexibility & RCTRootViewSizeFlexibilityWidth ? INFINITY : size.width,
      _sizeFlexibility & RCTRootViewSizeFlexibilityHeight ? INFINITY : size.height
    );
}

- (void)updateAvailableSize
{
  if (!self.reactTag || !_bridge.isValid) {
    return;
  }

  [_bridge.uiManager setAvailableSize:self.availableSize forRootView:self];
}

- (void)setBackgroundColor:(UIColor *)backgroundColor
{
  _backgroundColor = backgroundColor;
  if (self.reactTag && _bridge.isValid) {
    [_bridge.uiManager setBackgroundColor:backgroundColor forView:self];
  }
}

- (UIColor *)backgroundColor
{
  return _backgroundColor;
}

- (UIView *)hitTest:(CGPoint)point withEvent:(UIEvent *)event
{
  // The root content view itself should never receive touches
  UIView *hitView = [super hitTest:point withEvent:event];
  if (_passThroughTouches && hitView == self) {
    return nil;
  }
  return hitView;
}

- (void)invalidate
{
  if (self.userInteractionEnabled) {
    self.userInteractionEnabled = NO;
    [(RCTRootView *)self.superview contentViewInvalidated];
    [_bridge enqueueJSCall:@"AppRegistry"
                    method:@"unmountApplicationComponentAtRootTag"
                      args:@[self.reactTag]
                completion:NULL];
  }
}

@end
