#import "RCTDrawerView.h"
#import "RCTDrawerViewController.h"

#import <Foundation/Foundation.h>

#import "RCTBridge.h"
#import "RCTAssert.h"
#import "RCTBridge.h"
#import "RCTModalHostViewController.h"
#import "RCTTouchHandler.h"
#import "RCTUIManager.h"
#import "RCTUtils.h"
#import "UIView+React.h"

// React UIView has a protocol with callbacks eg insertReactSubview
// to add the view in the sidebar instead


@implementation RCTDrawerView {
  __weak RCTBridge *_bridge;
  BOOL _visible;
  NSInteger _width;
  BOOL _isPresented;
  RCTDrawerViewController *_drawerViewController;
  RCTTouchHandler *_touchHandler;
  UIView *_reactSubview;
  UIInterfaceOrientation _lastKnownOrientation;
  RCTDirectEventBlock _onRequestClose;
}

RCT_NOT_IMPLEMENTED(-(instancetype)initWithFrame : (CGRect)frame)
RCT_NOT_IMPLEMENTED(-(instancetype)initWithCoder : coder)

- (instancetype)initWithBridge:(RCTBridge *)bridge
{
  if ((self = [super initWithFrame:CGRectZero])) {
    _bridge = bridge;
    _drawerViewController = [[RCTDrawerViewController alloc] init];
    UIView *containerView = [UIView new];
    containerView.autoresizingMask = UIViewAutoresizingFlexibleHeight | UIViewAutoresizingFlexibleWidth;
    _drawerViewController.view = containerView;
    _touchHandler = [[RCTTouchHandler alloc] initWithBridge:bridge];
    _visible = NO;
    _isPresented = NO;
    
    __weak typeof(self) weakSelf = self;
    _drawerViewController.boundsDidChangeBlock = ^(CGRect newBounds) {
      [weakSelf notifyForBoundsChange:newBounds];
    };
  }
  
  return self;
}

- (void)notifyForBoundsChange:(CGRect)newBounds
{
  if (_reactSubview) {
    [_bridge.uiManager setSize:CGSizeMake(_width, newBounds.size.height) forView:_reactSubview];
  }
  
  UIInterfaceOrientation currentOrientation = [RCTSharedApplication() statusBarOrientation];
  if (currentOrientation == _lastKnownOrientation) {
    return;
  }
  _lastKnownOrientation = currentOrientation;

  BOOL isLandscape = currentOrientation == UIInterfaceOrientationLandscapeLeft ||
      currentOrientation == UIInterfaceOrientationLandscapeRight;
  
  // Quickly remove gesture when orientation changes
  UISplitViewController *presentedViewController = RCTPresentedViewController();

  if(isLandscape) {
    [presentedViewController setPresentsWithGesture:NO];
  }
}

- (void)insertReactSubview:(UIView *)subview atIndex:(NSInteger)atIndex
{
  RCTAssert(_reactSubview == nil, @"Drawer view can only have one subview");
  [super insertReactSubview:subview atIndex:atIndex];
  [_touchHandler attachToView:subview];

  [_drawerViewController.view insertSubview:subview atIndex:0];
  _reactSubview = subview;
}

- (void)removeReactSubview:(UIView *)subview
{
  RCTAssert(subview == _reactSubview, @"Cannot remove view other than drawer view");
  // Superclass (category) removes the `subview` from actual `superview`.
  [super removeReactSubview:subview];
  [_touchHandler detachFromView:subview];
  _reactSubview = nil;
}

- (void)didUpdateReactSubviews
{
  
  // Do nothing, as subview (singular) is managed by `insertReactSubview:atIndex:`
}

- (void)setVisible:(BOOL)visible
{
  if (_visible != visible) {
    _visible = visible;
    [self ensurePresentedOnlyIfNeeded];
  }
}

- (void)setWidth:(NSInteger)width {
  _width = width;
}

- (void)ensurePresentedOnlyIfNeeded
{
  BOOL shouldBePresented = !_isPresented && _visible;
  if (shouldBePresented) {
    UISplitViewController *presentedViewController = RCTPresentedViewController();
    [presentedViewController setViewController:_drawerViewController forColumn:UISplitViewControllerColumnPrimary];
    [presentedViewController setPresentsWithGesture:YES];
    _isPresented = YES;
  }

  BOOL shouldBeHidden = _isPresented && !_visible;
  if (shouldBeHidden) {
    [self removeDrawer];
  }
}

- (void)invalidate
{
  // When going back, react navigation renderers the previous view
  // before invalidating the current one
  //dispatch_async(dispatch_get_main_queue(), ^{
  //  [self removeDrawer];
  //});
}

- (void) removeDrawer
{
  if (_isPresented) {
    UISplitViewController *presentedViewController = RCTPresentedViewController();
    [presentedViewController setViewController:nil forColumn:UISplitViewControllerColumnPrimary];
    [presentedViewController setPresentsWithGesture:NO];
    _isPresented = NO;
  }
}


@end
