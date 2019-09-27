/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTStatusBarManager.h"

#import "RCTEventDispatcher.h"
#import "RCTLog.h"
#import "RCTUtils.h"
#import "RCTUIManager.h"
#import "RCTBridge.h"
#import "RCTRootViewController.h"

#if !TARGET_OS_TV
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
      type, [RCTConvertEnumValue("UIStatusBarStyle", mapping, @(UIStatusBarStyleDefault), json) integerValue]);
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
#endif

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

- (NSArray<NSString *> *)supportedEvents
{
  return @[ @"statusBarFrameDidChange", @"statusBarFrameWillChange" ];
}

#if !TARGET_OS_TV

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

- (UIViewController<RCTRootViewControllerProtocol>*) viewControllerForReactTag:(nonnull NSNumber *)reactTag
{
  if (!RCTViewControllerBasedStatusBarAppearance()) {
    return nil;
  }

  UIView *view = [self.bridge.uiManager viewForReactTag:reactTag];
  UIViewController *viewController = view.window.rootViewController ?: RCTKeyWindow().rootViewController;

  if ([viewController conformsToProtocol:@protocol(RCTRootViewControllerProtocol)]) {
    return (UIViewController<RCTRootViewControllerProtocol>*) viewController;
  } else {
    RCTLogError(@"RCTStatusBarManager could not find RCTRootViewController. \
                If UIViewControllerBasedStatusBarAppearance key in the Info.plist is set to YES (recommended for new apps), \
                You need to use RCTRootViewControllerProtocol-conforming view controller as app window's root view controller \
                and must pass a node reference to `surface` argument of StatusBar methods.");
    return nil;
  }
}

RCT_EXPORT_METHOD(getHeight:(RCTResponseSenderBlock)callback)
{
  callback(@[ @{
    @"height" : @(RCTSharedApplication().statusBarFrame.size.height),
  } ]);
}

RCT_EXPORT_METHOD(setStyle:(UIStatusBarStyle)style
                  animated:(BOOL)animated
                  reactTag:(nonnull NSNumber *)reactTag)
{
  UIViewController<RCTRootViewControllerProtocol> *viewController = [self viewControllerForReactTag: reactTag];

  if (viewController) {
    [viewController updateStatusBarStyle:style
                                  hidden:viewController.prefersStatusBarHidden
                               animation:viewController.preferredStatusBarUpdateAnimation
                                animated:animated];
  } else {
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
    [RCTSharedApplication() setStatusBarStyle:style
                                     animated:animated];
#pragma clang diagnostic pop
  }
}

RCT_EXPORT_METHOD(setHidden:(BOOL)hidden
                  withAnimation:(UIStatusBarAnimation)animation
                  reactTag:(nonnull __unused NSNumber *)reactTag)
{
  UIViewController<RCTRootViewControllerProtocol> *viewController = [self viewControllerForReactTag: reactTag];

  if (viewController) {
    [viewController updateStatusBarStyle:viewController.preferredStatusBarStyle
                                  hidden:hidden
                               animation:animation
                                animated:animation != UIStatusBarAnimationNone];
  } else {
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
    [RCTSharedApplication() setStatusBarHidden:hidden
                                 withAnimation:animation];
#pragma clang diagnostic pop
  }
}

RCT_EXPORT_METHOD(setNetworkActivityIndicatorVisible : (BOOL)visible)
{
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
  RCTSharedApplication().networkActivityIndicatorVisible = visible;
#pragma clang diagnostic pop
}

#endif // TARGET_OS_TV

@end
