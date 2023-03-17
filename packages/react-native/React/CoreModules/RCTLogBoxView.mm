/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTLogBoxView.h"

#import <React/RCTLog.h>
#import <React/RCTSurface.h>
#import <React/RCTSurfaceHostingView.h>

@implementation RCTLogBoxView {
  RCTSurface *_surface;
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if ((self = [super initWithFrame:frame])) {
    self.windowLevel = UIWindowLevelStatusBar - 1;
    self.backgroundColor = [UIColor clearColor];
  }
  return self;
}

- (void)createRootViewController:(UIView *)view
{
  UIViewController *_rootViewController = [UIViewController new];
  _rootViewController.view = view;
  _rootViewController.view.backgroundColor = [UIColor clearColor];
  _rootViewController.modalPresentationStyle = UIModalPresentationFullScreen;
  self.rootViewController = _rootViewController;
}

- (instancetype)initWithWindow:(UIWindow *)window bridge:(RCTBridge *)bridge
{
  RCTErrorNewArchitectureValidation(RCTNotAllowedInFabricWithoutLegacy, @"RCTLogBoxView", nil);

  if (@available(iOS 13.0, *)) {
    self = [super initWithWindowScene:window.windowScene];
  } else {
    self = [super initWithFrame:window.frame];
  }

  self.windowLevel = UIWindowLevelStatusBar - 1;
  self.backgroundColor = [UIColor clearColor];

  _surface = [[RCTSurface alloc] initWithBridge:bridge moduleName:@"LogBox" initialProperties:@{}];
  [_surface start];

  if (![_surface synchronouslyWaitForStage:RCTSurfaceStageSurfaceDidInitialMounting timeout:1]) {
    RCTLogInfo(@"Failed to mount LogBox within 1s");
  }
  [self createRootViewController:(UIView *)_surface.view];

  return self;
}

- (instancetype)initWithWindow:(UIWindow *)window surfacePresenter:(id<RCTSurfacePresenterStub>)surfacePresenter
{
  if (@available(iOS 13.0, *)) {
    self = [super initWithWindowScene:window.windowScene];
  } else {
    self = [super initWithFrame:window.frame];
  }

  id<RCTSurfaceProtocol> surface = [surfacePresenter createFabricSurfaceForModuleName:@"LogBox" initialProperties:@{}];
  [surface start];
  RCTSurfaceHostingView *rootView = [[RCTSurfaceHostingView alloc]
      initWithSurface:surface
      sizeMeasureMode:RCTSurfaceSizeMeasureModeWidthExact | RCTSurfaceSizeMeasureModeHeightExact];
  [self createRootViewController:rootView];

  return self;
}

- (void)layoutSubviews
{
  [super layoutSubviews];
  [_surface setSize:self.frame.size];
}

- (void)dealloc
{
  [RCTSharedApplication().delegate.window makeKeyWindow];
}

- (void)show
{
  [self becomeFirstResponder];
  [self makeKeyAndVisible];
}

@end
