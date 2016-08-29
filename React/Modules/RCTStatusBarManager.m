/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTStatusBarManager.h"

#import "RCTEventDispatcher.h"
#import "RCTLog.h"
#import "RCTUtils.h"

#if TARGET_OS_TV
typedef enum {
  RCTStatusBarStyleDefault = 0,
  RCTStatusBarStyleLightContent
} RCTStatusBarStyle;

typedef enum {
  RCTStatusBarAnimationNone = 0,
  RCTStatusBarAnimationFade,
  RCTStatusBarAnimationSlide
} RCTStatusBarAnimation;

@implementation RCTConvert (UIStatusBar)

RCT_ENUM_CONVERTER(RCTStatusBarStyle, (@{
                                        @"default": @(RCTStatusBarStyleDefault),
                                        @"light-content": @(RCTStatusBarStyleLightContent),
                                        }), RCTStatusBarStyleDefault, integerValue);

RCT_ENUM_CONVERTER(RCTStatusBarAnimation, (@{
                                            @"none": @(RCTStatusBarAnimationNone),
                                            @"fade": @(RCTStatusBarAnimationFade),
                                            @"slide": @(RCTStatusBarAnimationSlide),
                                            }), RCTStatusBarAnimationNone, integerValue);

@end

#else

@implementation RCTConvert (UIStatusBar)

RCT_ENUM_CONVERTER(UIStatusBarStyle, (@{
  @"default": @(UIStatusBarStyleDefault),
  @"light-content": @(UIStatusBarStyleLightContent),
}), UIStatusBarStyleDefault, integerValue);

RCT_ENUM_CONVERTER(UIStatusBarAnimation, (@{
  @"none": @(UIStatusBarAnimationNone),
  @"fade": @(UIStatusBarAnimationFade),
  @"slide": @(UIStatusBarAnimationSlide),
}), UIStatusBarAnimationNone, integerValue);

@end

#endif //TARGET_OS_TV

@implementation RCTStatusBarManager

static BOOL RCTViewControllerBasedStatusBarAppearance()
{
  static BOOL value;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    value = [[[NSBundle mainBundle] objectForInfoDictionaryKey:
              @"UIViewControllerBasedStatusBarAppearance"] ?: @YES boolValue];
  });

  return value;
}

RCT_EXPORT_MODULE()

- (NSArray<NSString *> *)supportedEvents
{
  return @[@"statusBarFrameDidChange",
           @"statusBarFrameWillChange"];
}

- (void)startObserving
{
#if !TARGET_OS_TV
  NSNotificationCenter *nc = [NSNotificationCenter defaultCenter];
  [nc addObserver:self selector:@selector(applicationDidChangeStatusBarFrame:) name:UIApplicationDidChangeStatusBarFrameNotification object:nil];
  [nc addObserver:self selector:@selector(applicationWillChangeStatusBarFrame:) name:UIApplicationWillChangeStatusBarFrameNotification object:nil];
#endif
  
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
#if TARGET_OS_TV
  NSDictionary *event = @{};
#else
  CGRect frame = [notification.userInfo[UIApplicationStatusBarFrameUserInfoKey] CGRectValue];
  NSDictionary *event = @{
    @"frame": @{
      @"x": @(frame.origin.x),
      @"y": @(frame.origin.y),
      @"width": @(frame.size.width),
      @"height": @(frame.size.height),
    },
  };
#endif
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

RCT_EXPORT_METHOD(getHeight:(RCTResponseSenderBlock)callback)
{
#if TARGET_OS_TV
  callback(@[@{
    @"height":@0
               }]);
#else
  callback(@[@{
    @"height": @([UIApplication sharedApplication].statusBarFrame.size.height),
  }]);
#endif
}

#if !TARGET_OS_TV
RCT_EXPORT_METHOD(setStyle:(UIStatusBarStyle)statusBarStyle
                  animated:(BOOL)animated)
{
  if (RCTViewControllerBasedStatusBarAppearance()) {
    RCTLogError(@"RCTStatusBarManager module requires that the \
                UIViewControllerBasedStatusBarAppearance key in the Info.plist is set to NO");
  } else {
    [RCTSharedApplication() setStatusBarStyle:statusBarStyle
                                     animated:animated];
  }
}

RCT_EXPORT_METHOD(setHidden:(BOOL)hidden
                  withAnimation:(UIStatusBarAnimation)animation)
{
  if (RCTViewControllerBasedStatusBarAppearance()) {
    RCTLogError(@"RCTStatusBarManager module requires that the \
                UIViewControllerBasedStatusBarAppearance key in the Info.plist is set to NO");
  } else {
    [RCTSharedApplication() setStatusBarHidden:hidden
                                 withAnimation:animation];
  }
}
#endif

RCT_EXPORT_METHOD(setNetworkActivityIndicatorVisible:(BOOL)visible)
{
#if !TARGET_OS_TV
  RCTSharedApplication().networkActivityIndicatorVisible = visible;
#endif
}


@end
