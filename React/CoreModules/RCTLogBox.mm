/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTLogBox.h"

#import <FBReactNativeSpec/FBReactNativeSpec.h>
#import <React/RCTBridge.h>
#import <React/RCTBridgeModule.h>
#import <React/RCTLog.h>
#import <React/RCTRedBoxSetEnabled.h>
#import <React/RCTSurface.h>

#import "CoreModulesPlugins.h"

#if RCT_DEV_MENU

#if !TARGET_OS_OSX // TODO(macOS GH#774)
@interface RCTLogBoxWindow : UIWindow // TODO(OSS Candidate ISS#2710739) Renamed from RCTLogBoxView to RCTLogBoxWindow
@end

@implementation RCTLogBoxWindow {
  RCTSurface *_surface;
}

- (instancetype)initWithBridge:(RCTBridge *)bridge // TODO(OSS Candidate ISS#2710739) Dropped `frame` parameter to make it compatible with NSWindow based version
{
  CGRect frame = [UIScreen mainScreen].bounds;
  if ((self = [super initWithFrame:frame])) {
    self.windowLevel = UIWindowLevelStatusBar - 1;
    self.backgroundColor = [UIColor clearColor];

    _surface = [[RCTSurface alloc] initWithBridge:bridge moduleName:@"LogBox" initialProperties:@{}];

    [_surface start];
    [_surface setSize:frame.size];

    if (![_surface synchronouslyWaitForStage:RCTSurfaceStageSurfaceDidInitialMounting timeout:1]) {
      RCTLogInfo(@"Failed to mount LogBox within 1s");
    }

    UIViewController *_rootViewController = [UIViewController new];
    _rootViewController.view = (UIView *)_surface.view;
    _rootViewController.view.backgroundColor = [UIColor clearColor];
    _rootViewController.modalPresentationStyle = UIModalPresentationFullScreen;
    self.rootViewController = _rootViewController;
  }
  return self;
}

- (void)hide
{
  [RCTSharedApplication().delegate.window makeKeyWindow];
}

- (void)show
{
  [self becomeFirstResponder];
  [self makeKeyAndVisible];
}

@end

#else // [TODO(macOS GH#774)

@interface RCTLogBoxWindow : NSWindow
@end

@implementation RCTLogBoxWindow {
  RCTSurface *_surface;
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

- (void)hide
{
  if (NSApp.modalWindow == self) {
    [NSApp stopModal];
  }
  [self orderOut:nil];
}

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

#endif // ]TODO(macOS GH#774)

@interface RCTLogBox () <NativeLogBoxSpec, RCTBridgeModule>
@end

@implementation RCTLogBox {
  RCTLogBoxWindow *_window; // TODO(OSS Candidate ISS#2710739) Renamed from _view to _window
}

@synthesize bridge = _bridge;

RCT_EXPORT_MODULE()

+ (BOOL)requiresMainQueueSetup
{
  return YES;
}

RCT_EXPORT_METHOD(show)
{
  if (RCTRedBoxGetEnabled()) {
    __weak RCTLogBox *weakSelf = self;
    dispatch_async(dispatch_get_main_queue(), ^{
      __strong RCTLogBox *strongSelf = weakSelf;
      if (!strongSelf) {
        return;
      }
      if (!strongSelf->_window) {
        strongSelf->_window = [[RCTLogBoxWindow alloc] initWithBridge:self->_bridge];
      }
      [strongSelf->_window show];
    });
  }
}

RCT_EXPORT_METHOD(hide)
{
  if (RCTRedBoxGetEnabled()) {
    __weak RCTLogBox *weakSelf = self;
    dispatch_async(dispatch_get_main_queue(), ^{
      __strong RCTLogBox *strongSelf = weakSelf;
      if (!strongSelf) {
        return;
      }
      [strongSelf->_window hide];
      strongSelf->_window = nil;
    });
  }
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<facebook::react::NativeLogBoxSpecJSI>(params);
}

@end

#else // Disabled

@interface RCTLogBox () <NativeLogBoxSpec>
@end

@implementation RCTLogBox

+ (NSString *)moduleName
{
  return nil;
}

- (void)show
{
  // noop
}

- (void)hide
{
  // noop
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<facebook::react::NativeLogBoxSpecJSI>(params);
}
@end

#endif

Class RCTLogBoxCls(void)
{
  return RCTLogBox.class;
}
