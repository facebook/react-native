//
//  RCTDrawerView.m
//  HelloWorld
//
//  Created by Grégoire Van der Auwermeulen on 15.06.23.
//
#import "RCTDrawerView.h"
#import "RCTDrawerViewController.h"

#import <Foundation/Foundation.h>
#import <React/RCTBridge.h>

#import <React/RCTAssert.h>
#import <React/RCTBridge.h>
#import <React/RCTModalHostViewController.h>
#import <React/RCTTouchHandler.h>
#import <React/RCTUIManager.h>
#import <React/RCTUtils.h>
#import <React/UIView+React.h>


@implementation RCTDrawerView {
  __weak RCTBridge *_bridge;
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
    UIView *containerView = [[UIView alloc] init];
    containerView.autoresizingMask = UIViewAutoresizingFlexibleHeight | UIViewAutoresizingFlexibleWidth;
    _drawerViewController.view = containerView;
    
    UISplitViewController *presentedViewController = RCTPresentedViewController();
    [presentedViewController setViewController:_drawerViewController forColumn:UISplitViewControllerColumnPrimary];

    _touchHandler = [[RCTTouchHandler alloc] initWithBridge:bridge];
    
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
    [_bridge.uiManager setSize:newBounds.size forView:_reactSubview];
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



@end
