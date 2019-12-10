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
#import <React/RCTReloadCommand.h>
#import <React/RCTUtils.h>

#import <objc/runtime.h>

#import "CoreModulesPlugins.h"

#if RCT_DEV_MENU

@class RCTLogBoxWindow;

@protocol RCTLogBoxWindowActionDelegate <NSObject>

- (void)logBoxWindow:(RCTLogBoxWindow *)logBoxWindow openStackFrameInEditor:(RCTJSStackFrame *)stackFrame;
- (void)reloadFromlogBoxWindow:(RCTLogBoxWindow *)logBoxWindow;
- (void)loadExtraDataViewController;

@end

@interface RCTLogBoxWindow : UIWindow <UITableViewDelegate>
@property (nonatomic, weak) id<RCTLogBoxWindowActionDelegate> actionDelegate;
@end

@implementation RCTLogBoxWindow
{
  UITableView *_stackTraceTableView;
  NSString *_lastErrorMessage;
  NSArray<RCTJSStackFrame *> *_lastStackTrace;
  int _lastErrorCookie;
}

- (instancetype)initWithFrame:(CGRect)frame bridge:(RCTBridge *)bridge
{
  _lastErrorCookie = -1;
  if ((self = [super initWithFrame:frame])) {
#if TARGET_OS_TV
    self.windowLevel = UIWindowLevelAlert + 1000;
#else
    self.windowLevel = UIWindowLevelStatusBar - 1;
#endif
    self.backgroundColor = [UIColor clearColor];
    self.hidden = YES;

    RCTRootView *rootView = [[RCTRootView alloc] initWithBridge:bridge moduleName:@"LogBox" initialProperties:nil];

    UIViewController *rootViewController = [UIViewController new];
    rootViewController.view = rootView;
    self.rootViewController = rootViewController;
  }
  return self;
}


- (void)show
{
  [self becomeFirstResponder];
  [self makeKeyAndVisible];
}

- (void)dismiss
{
  self.hidden = YES;
  [self resignFirstResponder];
  [RCTSharedApplication().delegate.window makeKeyWindow];
}

@end

@interface RCTLogBox () <NativeLogBoxSpec>
@end

@implementation RCTLogBox
{
  RCTLogBoxWindow *_window;
}

@synthesize bridge = _bridge;

RCT_EXPORT_MODULE()

+ (BOOL)requiresMainQueueSetup
{
  return YES;
}

- (void)setBridge:(RCTBridge *)bridge
{
 _bridge = bridge;
 dispatch_async(dispatch_get_main_queue(), ^{
     self->_window = [[RCTLogBoxWindow alloc] initWithFrame:[UIScreen mainScreen].bounds bridge: self->_bridge];
 });
}

RCT_EXPORT_METHOD(show)
{
  dispatch_async(dispatch_get_main_queue(), ^{
    [self->_window show];
  });
}

RCT_EXPORT_METHOD(hide)
{
  dispatch_async(dispatch_get_main_queue(), ^{
    [self->_window dismiss];
  });
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModuleWithJsInvoker:(std::shared_ptr<facebook::react::CallInvoker>)jsInvoker
{
  return std::make_shared<facebook::react::NativeLogBoxSpecJSI>(self, jsInvoker);
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
