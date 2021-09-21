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

@interface RCTLogBox () <NativeLogBoxSpec, RCTBridgeModule>
@end

@implementation RCTLogBox {
  RCTLogBoxWindow *_window; // TODO(macOS GH#774) Renamed from _view to _window
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
      if (!strongSelf->_window) { // TODO(macOS GH#774) Renamed from _view to _window
        if (self->_bridge) {
#if !TARGET_OS_OSX // TODO(macOS GH#774)
          strongSelf->_window = [[RCTLogBoxWindow alloc] initWithFrame:[UIScreen mainScreen].bounds bridge:self->_bridge]; // TODO(macOS GH#774) Renamed from _view to _window
#else // [TODO(macOS GH#774)
          strongSelf->_window = [[RCTLogBoxWindow alloc] initWithBridge:self->_bridge]; // TODO(macOS GH#774) Renamed from _view to _window
#endif // ]TODO(macOS GH#774)
        } else {
          NSDictionary *userInfo = [NSDictionary dictionaryWithObjectsAndKeys:strongSelf, @"logbox", nil];
          [[NSNotificationCenter defaultCenter] postNotificationName:@"CreateLogBoxSurface"
                                                              object:nil
                                                            userInfo:userInfo];
          return;
        }
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
#if TARGET_OS_OSX // TODO(macOS GH#774)
      [strongSelf->_window hide];
#endif // TODO(macOS GH#774)
      strongSelf->_window = nil;
    });
  }
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<facebook::react::NativeLogBoxSpecJSI>(params);
}

- (void)setRCTLogBoxWindow:(RCTLogBoxWindow *)window // TODO(macOS GH#774) Renamed from _view to _window
{
  self->_window = window;
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
