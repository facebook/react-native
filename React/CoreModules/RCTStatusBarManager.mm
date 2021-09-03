/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTStatusBarManager.h"
#import "CoreModulesPlugins.h"

#import <React/RCTEventDispatcherProtocol.h>
#import <React/RCTLog.h>
#import <React/RCTUtils.h>

#import <FBReactNativeSpec/FBReactNativeSpec.h>

@implementation RCTConvert (UIStatusBar)

+ (UIStatusBarStyle)UIStatusBarStyle:(id)json RCT_DYNAMIC
{
  static NSDictionary *mapping;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    if (@available(iOS 13.0, *)) {
      mapping = @{
        @"default" : @(UIStatusBarStyleDefault),
        @"light-content" : @(UIStatusBarStyleLightContent),
#if defined(__IPHONE_OS_VERSION_MAX_ALLOWED) && defined(__IPHONE_13_0) && \
    __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_13_0
        @"dark-content" : @(UIStatusBarStyleDarkContent)
#else
          @"dark-content": @(UIStatusBarStyleDefault)
#endif
      };

    } else {
      mapping = @{
        @"default" : @(UIStatusBarStyleDefault),
        @"light-content" : @(UIStatusBarStyleLightContent),
        @"dark-content" : @(UIStatusBarStyleDefault)
      };
    }
  });
  return _RCT_CAST(
      UIStatusBarStyle,
      [RCTConvertEnumValue("UIStatusBarStyle", mapping, @(UIStatusBarStyleDefault), json) integerValue]);
}

RCT_ENUM_CONVERTER(
    UIStatusBarAnimation,
    (@{
      @"none" : @(UIStatusBarAnimationNone),
      @"fade" : @(UIStatusBarAnimationFade),
      @"slide" : @(UIStatusBarAnimationSlide),
    }),
    UIStatusBarAnimationNone,
    integerValue);

@end

@interface RCTStatusBarManager () <NativeStatusBarManagerIOSSpec>
@end

@implementation RCTStatusBarManager

static BOOL RCTViewControllerBasedStatusBarAppearance()
{
  static BOOL value;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    value =
        [[[NSBundle mainBundle] objectForInfoDictionaryKey:@"UIViewControllerBasedStatusBarAppearance"]
                ?: @YES boolValue];
  });

  return value;
}

RCT_EXPORT_MODULE()

+ (BOOL)requiresMainQueueSetup
{
  return YES;
}

- (NSArray<NSString *> *)supportedEvents
{
  return @[ @"statusBarFrameDidChange", @"statusBarFrameWillChange" ];
}

- (void)startObserving
{
  NSNotificationCenter *nc = [NSNotificationCenter defaultCenter];
  [nc addObserver:self
         selector:@selector(applicationDidChangeStatusBarFrame:)
             name:UIApplicationDidChangeStatusBarFrameNotification
           object:nil];
  [nc addObserver:self
         selector:@selector(applicationWillChangeStatusBarFrame:)
             name:UIApplicationWillChangeStatusBarFrameNotification
           object:nil];
}

- (void)stopObserving
{
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}

- (void)emitEvent:(NSString *)eventName forNotification:(NSNotification *)notification
{
  CGRect frame = [notification.userInfo[UIApplicationStatusBarFrameUserInfoKey] CGRectValue];
  NSDictionary *event = @{
    @"frame" : @{
      @"x" : @(frame.origin.x),
      @"y" : @(frame.origin.y),
      @"width" : @(frame.size.width),
      @"height" : @(frame.size.height),
    },
  };
  [self sendEventWithName:eventName body:event];
}

- (void)applicationDidChangeStatusBarFrame:(NSNotification *)notification
{
  [self emitEvent:@"statusBarFrameDidChange" forNotification:notification];
}

- (void)applicationWillChangeStatusBarFrame:(NSNotification *)notification
{
  [self emitEvent:@"statusBarFrameWillChange" forNotification:notification];
}

RCT_EXPORT_METHOD(getHeight : (RCTResponseSenderBlock)callback)
{
  callback(@[ @{
    @"height" : @(RCTSharedApplication().statusBarFrame.size.height),
  } ]);
}

RCT_EXPORT_METHOD(setStyle : (NSString *)style animated : (BOOL)animated)
{
  UIStatusBarStyle statusBarStyle = [RCTConvert UIStatusBarStyle:style];
  if (RCTViewControllerBasedStatusBarAppearance()) {
    RCTLogError(@"RCTStatusBarManager module requires that the \
                UIViewControllerBasedStatusBarAppearance key in the Info.plist is set to NO");
  } else {
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
    [RCTSharedApplication() setStatusBarStyle:statusBarStyle animated:animated];
  }
#pragma clang diagnostic pop
}

RCT_EXPORT_METHOD(setHidden : (BOOL)hidden withAnimation : (NSString *)withAnimation)
{
  UIStatusBarAnimation animation = [RCTConvert UIStatusBarAnimation:withAnimation];
  if (RCTViewControllerBasedStatusBarAppearance()) {
    RCTLogError(@"RCTStatusBarManager module requires that the \
                UIViewControllerBasedStatusBarAppearance key in the Info.plist is set to NO");
  } else {
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
    [RCTSharedApplication() setStatusBarHidden:hidden withAnimation:animation];
#pragma clang diagnostic pop
  }
}

RCT_EXPORT_METHOD(setNetworkActivityIndicatorVisible : (BOOL)visible)
{
  RCTSharedApplication().networkActivityIndicatorVisible = visible;
}

- (facebook::react::ModuleConstants<JS::NativeStatusBarManagerIOS::Constants>)getConstants
{
  __block facebook::react::ModuleConstants<JS::NativeStatusBarManagerIOS::Constants> constants;
  RCTUnsafeExecuteOnMainQueueSync(^{
    constants = facebook::react::typedConstants<JS::NativeStatusBarManagerIOS::Constants>({
        .HEIGHT = RCTSharedApplication().statusBarFrame.size.height,
        .DEFAULT_BACKGROUND_COLOR = folly::none,
    });
  });

  return constants;
}

- (facebook::react::ModuleConstants<JS::NativeStatusBarManagerIOS::Constants>)constantsToExport
{
  return (facebook::react::ModuleConstants<JS::NativeStatusBarManagerIOS::Constants>)[self getConstants];
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<facebook::react::NativeStatusBarManagerIOSSpecJSI>(params);
}

@end

Class RCTStatusBarManagerCls(void)
{
  return RCTStatusBarManager.class;
}
