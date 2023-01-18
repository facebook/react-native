/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTLogBoxView.h"

#import <React/RCTLog.h>
#import <React/RCTSurface.h>
<<<<<<< HEAD
#import <React/RCTSurfaceHostingView.h>

#if !TARGET_OS_OSX // [macOS]
||||||| 49f3f47b1e9
=======
#import <React/RCTSurfaceHostingView.h>
>>>>>>> 890805db9cc639846c93edc0e13eddbf67dbc7af

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

<<<<<<< HEAD
- (instancetype)initWithFrame:(CGRect)frame surfacePresenter:(id<RCTSurfacePresenterStub>)surfacePresenter
||||||| 49f3f47b1e9
- (instancetype)initWithFrame:(CGRect)frame bridge:(RCTBridge *)bridge
=======
- (instancetype)initWithWindow:(UIWindow *)window bridge:(RCTBridge *)bridge
>>>>>>> 890805db9cc639846c93edc0e13eddbf67dbc7af
{
<<<<<<< HEAD
  if (self = [super initWithFrame:frame]) {
    id<RCTSurfaceProtocol> surface = [surfacePresenter createFabricSurfaceForModuleName:@"LogBox"
                                                                      initialProperties:@{}];
    [surface start];
    RCTSurfaceHostingView *rootView = [[RCTSurfaceHostingView alloc]
        initWithSurface:surface
        sizeMeasureMode:RCTSurfaceSizeMeasureModeWidthExact | RCTSurfaceSizeMeasureModeHeightExact];
||||||| 49f3f47b1e9
  if ((self = [super initWithFrame:frame])) {
    self.windowLevel = UIWindowLevelStatusBar - 1;
    self.backgroundColor = [UIColor clearColor];
=======
  RCTErrorNewArchitectureValidation(RCTNotAllowedInFabricWithoutLegacy, @"RCTLogBoxView", nil);
>>>>>>> 890805db9cc639846c93edc0e13eddbf67dbc7af

<<<<<<< HEAD
    [self createRootViewController:rootView];
||||||| 49f3f47b1e9
    _surface = [[RCTSurface alloc] initWithBridge:bridge moduleName:@"LogBox" initialProperties:@{}];

    [_surface start];
    [_surface setSize:frame.size];

    if (![_surface synchronouslyWaitForStage:RCTSurfaceStageSurfaceDidInitialMounting timeout:1]) {
      RCTLogInfo(@"Failed to mount LogBox within 1s");
    }

    [self createRootViewController:(UIView *)_surface.view];
=======
  if (@available(iOS 13.0, *)) {
    self = [super initWithWindowScene:window.windowScene];
  } else {
    self = [super initWithFrame:window.frame];
>>>>>>> 890805db9cc639846c93edc0e13eddbf67dbc7af
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

<<<<<<< HEAD
- (instancetype)initWithWindow:(UIWindow *)window bridge:(RCTBridge *)bridge
{
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

- (void)layoutSubviews
{
  [super layoutSubviews];
  [_surface setSize:self.frame.size];
}

||||||| 49f3f47b1e9
=======
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

>>>>>>> 890805db9cc639846c93edc0e13eddbf67dbc7af
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

#else // [macOS

@implementation RCTLogBoxView {
  RCTSurface *_surface;
}

- (instancetype)initWithSurfacePresenter:(id<RCTSurfacePresenterStub>)surfacePresenter
{
  NSRect bounds = NSMakeRect(0, 0, 600, 800);
  if ((self = [self initWithContentRect:bounds
                                styleMask:NSWindowStyleMaskTitled
                                  backing:NSBackingStoreBuffered
                                    defer:YES])) {
    id<RCTSurfaceProtocol> surface = [surfacePresenter createFabricSurfaceForModuleName:@"LogBox"
                                                                        initialProperties:@{}];
    [surface start];
    RCTSurfaceHostingView *rootView = [[RCTSurfaceHostingView alloc]
        initWithSurface:surface
        sizeMeasureMode:RCTSurfaceSizeMeasureModeWidthExact | RCTSurfaceSizeMeasureModeHeightExact];    
      
    self.contentView = rootView;
    self.contentView.autoresizingMask = NSViewWidthSizable | NSViewHeightSizable;
  }
  return self;
}

- (instancetype)initWithBridge:(RCTBridge *)bridge
{
  NSRect bounds = NSMakeRect(0, 0, 600, 800);
  if ((self = [self initWithContentRect:bounds
                              styleMask:NSWindowStyleMaskTitled
                                backing:NSBackingStoreBuffered
                                  defer:YES])) {
    _surface = [[RCTSurface alloc] initWithBridge:bridge moduleName:@"LogBox" initialProperties:@{}];

    [_surface start];
    [_surface setSize:bounds.size];

    if (![_surface synchronouslyWaitForStage:RCTSurfaceStageSurfaceDidInitialMounting timeout:1]) {
      RCTLogInfo(@"Failed to mount LogBox within 1s");
    }

    self.contentView = (NSView *)_surface.view;
    self.contentView.autoresizingMask = NSViewWidthSizable | NSViewHeightSizable;
  }
  return self;
}

- (void)setHidden:(BOOL)hidden // [macOS
{
  if (hidden) {
    if (NSApp.modalWindow == self) {
      [NSApp stopModal];
    }
    [self orderOut:nil];
  }
} // macOS]

- (void)show
{
  if (!RCTRunningInTestEnvironment()) {
    // Run the modal loop outside of the dispatch queue because it is not reentrant.
    [self performSelectorOnMainThread:@selector(_showModal) withObject:nil waitUntilDone:NO];
  }
  else {
    [NSApp activateIgnoringOtherApps:YES];
    [self makeKeyAndOrderFront:nil];
  }
}

- (void)_showModal
{
  NSModalSession session = [NSApp beginModalSessionForWindow:self];

  while ([NSApp runModalSession:session] == NSModalResponseContinue) {
    // Spin the runloop so that the main dispatch queue is processed.
    [[NSRunLoop currentRunLoop] limitDateForMode:NSDefaultRunLoopMode];
  }

  [NSApp endModalSession:session];
}

@end

#endif // macOS]
