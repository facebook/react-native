/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTRootContentView.h"

#import "RCTBridge.h"
#import "RCTDeviceInfo.h" // [macOS]
#import "RCTPerformanceLogger.h"
#import "RCTRootView.h"
#import "RCTRootViewInternal.h"
#import "RCTTouchHandler.h"
#import "RCTUIManager.h"
#import "UIView+React.h"

@implementation RCTRootContentView
{ // [macOS
#if TARGET_OS_OSX
  BOOL _subscribedToWindowNotifications;
#endif
} // macOS]

- (instancetype)initWithFrame:(CGRect)frame
                       bridge:(RCTBridge *)bridge
                     reactTag:(NSNumber *)reactTag
              sizeFlexibility:(RCTRootViewSizeFlexibility)sizeFlexibility
{
  if ((self = [super initWithFrame:frame])) {
    _bridge = bridge;
    self.reactTag = reactTag;
    _sizeFlexibility = sizeFlexibility;
    _touchHandler = [[RCTTouchHandler alloc] initWithBridge:_bridge];
    [_touchHandler attachToView:self];
    [_bridge.uiManager registerRootView:self];
#if TARGET_OS_OSX // [macOS
    self.postsFrameChangedNotifications = YES;
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(sendFrameChangedEvent:) name:NSViewFrameDidChangeNotification object:self];
#endif // macOS]
  }
  return self;
}

RCT_NOT_IMPLEMENTED(-(instancetype)initWithFrame : (CGRect)frame)
RCT_NOT_IMPLEMENTED(-(instancetype)initWithCoder : (nonnull NSCoder *)aDecoder)

#if TARGET_OS_OSX // [macOS
- (void)dealloc
{
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

- (void)viewWillMoveToWindow:(nullable NSWindow *)newWindow
{
  if (_subscribedToWindowNotifications &&
      self.window != nil &&
      self.window != newWindow) {
    [[NSNotificationCenter defaultCenter] removeObserver:self
                                                    name:NSWindowDidChangeBackingPropertiesNotification
                                                  object:self.window];
    _subscribedToWindowNotifications = NO;
  }
}

- (void)viewDidMoveToWindow
{
  if (!_subscribedToWindowNotifications &&
      self.window != nil) {
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(sendFrameChangedEvent:)
                                                 name:NSWindowDidChangeBackingPropertiesNotification
                                               object:self.window];
    _subscribedToWindowNotifications = YES;
  }
}

- (void)sendFrameChangedEvent:(__unused NSNotification *)notification
{
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
  [_bridge.eventDispatcher sendDeviceEventWithName:@"didUpdateDimensions"
                                              body:RCTExportedDimensions(self, self.bridge)];
#pragma clang diagnostic pop
}

#endif // macOS]

- (void)layoutSubviews
{
  [super layoutSubviews];
  [self updateAvailableSize];
}

- (void)insertReactSubview:(RCTUIView *)subview atIndex:(NSInteger)atIndex // [macOS]
{
  [super insertReactSubview:subview atIndex:atIndex];
  [_bridge.performanceLogger markStopForTag:RCTPLTTI];
  dispatch_async(dispatch_get_main_queue(), ^{
    if (!self->_contentHasAppeared) {
      self->_contentHasAppeared = YES;
      [[NSNotificationCenter defaultCenter] postNotificationName:RCTContentDidAppearNotification object:self.superview];
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
      _sizeFlexibility & RCTRootViewSizeFlexibilityHeight ? INFINITY : size.height);
}

- (void)updateAvailableSize
{
  if (!self.reactTag || !_bridge.isValid) {
    return;
  }

  [_bridge.uiManager setAvailableSize:self.availableSize forRootView:self];
}

- (RCTPlatformView *)hitTest:(CGPoint)point withEvent:(UIEvent *)event // [macOS]
{
  // The root content view itself should never receive touches
  RCTPlatformView *hitView = [super hitTest:point withEvent:event]; // [macOS]
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
                      args:@[ self.reactTag ]
                completion:NULL];
  }
}

@end
