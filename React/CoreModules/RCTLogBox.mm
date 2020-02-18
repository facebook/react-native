/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTLogBox.h"

#import <FBReactNativeSpec/FBReactNativeSpec.h>
#import <React/RCTBridge.h>
#import <React/RCTRootView.h>
#import <React/RCTConvert.h>
#import <React/RCTDefines.h>
#import <React/RCTErrorInfo.h>
#import <React/RCTEventDispatcher.h>
#import <React/RCTJSStackFrame.h>
#import <React/RCTRedBoxSetEnabled.h>
#import <React/RCTReloadCommand.h>
#import <React/RCTRedBoxSetEnabled.h>
#import <React/RCTSurface.h>
#import <React/RCTUtils.h>

#import <objc/runtime.h>

#import "CoreModulesPlugins.h"

#if RCT_DEV_MENU

@class RCTLogBoxView;

@interface RCTLogBoxView : UIWindow
@end

@implementation RCTLogBoxView
{
  RCTSurface *_surface;
}

- (instancetype)initWithFrame:(CGRect)frame bridge:(RCTBridge *)bridge
{
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

@interface RCTLogBox () <NativeLogBoxSpec>
@end

@implementation RCTLogBox
{
  RCTLogBoxView *_view;
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
    dispatch_async(dispatch_get_main_queue(), ^{
      if (!self->_view) {
        self->_view = [[RCTLogBoxView alloc] initWithFrame:[UIScreen mainScreen].bounds bridge: self->_bridge];
      }
      [self->_view show];
    });
  }
}

RCT_EXPORT_METHOD(hide)
{
  if (RCTRedBoxGetEnabled()) {
    dispatch_async(dispatch_get_main_queue(), ^{
      self->_view = nil;
    });
  }
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModuleWithJsInvoker:(std::shared_ptr<facebook::react::CallInvoker>)jsInvoker
{
  if (RCTRedBoxGetEnabled()) {
    return std::make_shared<facebook::react::NativeLogBoxSpecJSI>(self, jsInvoker);
  }

  return nullptr;
}

@end

#else // Disabled

@interface RCTLogBox() <NativeLogBoxSpec>
@end

@implementation RCTLogBox

+ (NSString *)moduleName
{
  return nil;
}

- (void)show {
  // noop
}

- (void)hide {
  // noop
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModuleWithJsInvoker:(std::shared_ptr<facebook::react::CallInvoker>)jsInvoker
{
  return std::make_shared<facebook::react::NativeLogBoxSpecJSI>(self, jsInvoker);
}
@end

#endif

Class RCTLogBoxCls(void) {
  return RCTLogBox.class;
}
