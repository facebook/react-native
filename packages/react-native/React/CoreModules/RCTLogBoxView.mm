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
#if TARGET_OS_OSX // [macOS
  NSWindow *_window;
#endif // macOS]
}

#if !TARGET_OS_OSX // [macOS]
- (instancetype)initWithFrame:(CGRect)frame
{
  if ((self = [super initWithFrame:frame])) {
    self.windowLevel = UIWindowLevelStatusBar - 1;
    self.backgroundColor = [UIColor clearColor];
  }
  return self;
}
#endif // [macOS]

- (void)createRootViewController:(RCTUIView *)view // [macOS]
{
  RCTUIViewController *_rootViewController = [RCTUIViewController new]; // [macOS]
  _rootViewController.view = view;
#if !TARGET_OS_OSX // [macOS]
  _rootViewController.view.backgroundColor = [UIColor clearColor];
  _rootViewController.modalPresentationStyle = UIModalPresentationFullScreen;
  self.rootViewController = _rootViewController;
#else // [macOS
  _rootViewController.view.wantsLayer = true;
  _rootViewController.view.layer.backgroundColor = [NSColor clearColor].CGColor;
  self.contentViewController = _rootViewController;
#endif // macOS]
}

- (instancetype)initWithWindow:(RCTUIWindow *)window bridge:(RCTBridge *)bridge // [macOS]
{
  RCTErrorNewArchitectureValidation(RCTNotAllowedInFabricWithoutLegacy, @"RCTLogBoxView", nil);

#if !TARGET_OS_OSX // [macOS]
  self = [super initWithWindowScene:window.windowScene];

  self.windowLevel = UIWindowLevelStatusBar - 1;
  self.backgroundColor = [UIColor clearColor];
#else // [macOS
  NSRect bounds = NSMakeRect(0, 0, 600, 800);
  self = [super initWithContentRect:bounds styleMask:NSWindowStyleMaskBorderless backing:NSBackingStoreBuffered defer:YES];
  
  self.level = NSStatusWindowLevel;
  self.backgroundColor = [NSColor clearColor];

  _window = window;
#endif // macOS]

  _surface = [[RCTSurface alloc] initWithBridge:bridge moduleName:@"LogBox" initialProperties:@{}];
  [_surface start];
  
  if (![_surface synchronouslyWaitForStage:RCTSurfaceStageSurfaceDidInitialMounting timeout:1]) {
    RCTLogInfo(@"Failed to mount LogBox within 1s");
  }
  [self createRootViewController:(RCTUIView *)_surface.view]; // [macOS]

  return self;
}

- (instancetype)initWithWindow:(RCTUIWindow *)window surfacePresenter:(id<RCTSurfacePresenterStub>)surfacePresenter // [macOS]
{
#if !TARGET_OS_OSX // [macOS]
  self = [super initWithWindowScene:window.windowScene];
#else // [macOS
  self = [super initWithContentRect:NSMakeRect(0, 0, 600, 800)  
                          styleMask:NSWindowStyleMaskBorderless | NSWindowStyleMaskFullSizeContentView  
                            backing:NSBackingStoreBuffered  
                              defer:YES];  
  _window = window;
#endif // macOS]

  id<RCTSurfaceProtocol> surface = [surfacePresenter createFabricSurfaceForModuleName:@"LogBox" initialProperties:@{}];
  [surface start];
  RCTSurfaceHostingView *rootView = [[RCTSurfaceHostingView alloc]
      initWithSurface:surface
      sizeMeasureMode:RCTSurfaceSizeMeasureModeWidthExact | RCTSurfaceSizeMeasureModeHeightExact];
  [self createRootViewController:rootView];

  return self;
}

#if !TARGET_OS_OSX // [macOS]
- (void)layoutSubviews
{
  [super layoutSubviews];
  [_surface setSize:self.frame.size];
}
#else // [macOS
- (void)layoutIfNeeded
{
  [super layoutIfNeeded];
  NSRect frame = NSMakeRect(self.frame.origin.x, self.frame.origin.y, 600, 800);
  [self setFrame:frame display:NO];
  [_surface setSize:self.frame.size];
}
#endif // macOS]

#if !TARGET_OS_OSX // [macOS]
- (void)dealloc
{
  [RCTSharedApplication().delegate.window makeKeyWindow];
}
#endif // [macOS]

#if !TARGET_OS_OSX // [macOS]
- (void)show
{
  [self becomeFirstResponder];
  [self makeKeyAndVisible];
}
#else // [macOS
- (void)show
{
  [_window beginSheet:self completionHandler:nil];
}

- (void)setHidden:(BOOL)hidden
{
  [_window endSheet:self];
}
#endif // [macOS]

@end
