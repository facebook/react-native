/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <QuartzCore/QuartzCore.h>

#import "RCTBridge.h"
#import "RCTDevLoadingView.h"
#import "RCTDefines.h"
#import "RCTUtils.h"
#import "RCTModalHostViewController.h"

#if RCT_DEV

static BOOL isEnabled = YES;

@implementation RCTDevLoadingView
{
  UIWindow *_window;
  UILabel *_label;
  NSDate *_showDate;
}

@synthesize bridge = _bridge;

RCT_EXPORT_MODULE()

+ (void)setEnabled:(BOOL)enabled
{
  isEnabled = enabled;
}

- (void)dealloc
{
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

- (void)setBridge:(RCTBridge *)bridge
{
  _bridge = bridge;

  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(hide)
                                               name:RCTJavaScriptDidLoadNotification
                                             object:nil];

  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(hide)
                                               name:RCTJavaScriptDidFailToLoadNotification
                                             object:nil];
  [self showWithURL:bridge.bundleURL];
}

RCT_EXPORT_METHOD(showMessage:(NSString *)message color:(UIColor *)color backgroundColor:(UIColor *)backgroundColor)
{
  if (!isEnabled) {
    return;
  }

  dispatch_async(dispatch_get_main_queue(), ^{
    _showDate = [NSDate date];
    if (!_window && !RCTRunningInTestEnvironment()) {
      CGFloat screenWidth = [UIScreen mainScreen].bounds.size.width;
      _window = [[UIWindow alloc] initWithFrame:CGRectMake(0, 0, screenWidth, 22)];
      _window.windowLevel = UIWindowLevelStatusBar + 1;

      // set a root VC so rotation is supported
      _window.rootViewController = [RCTModalHostViewController new];

      _label = [[UILabel alloc] initWithFrame:_window.bounds];
      _label.font = [UIFont systemFontOfSize:12.0];
      _label.textAlignment = NSTextAlignmentCenter;

      [_window addSubview:_label];
      [_window makeKeyAndVisible];
    }

    _label.text = message;
    _label.textColor = color;
    _window.backgroundColor = backgroundColor;
    _window.hidden = NO;
  });
}

RCT_EXPORT_METHOD(hide)
{
  if (!isEnabled) {
    return;
  }

  dispatch_async(dispatch_get_main_queue(), ^{
    const NSTimeInterval MIN_PRESENTED_TIME = 0.6;
    NSTimeInterval presentedTime = [[NSDate date] timeIntervalSinceDate:_showDate];
    NSTimeInterval delay = MAX(0, MIN_PRESENTED_TIME - presentedTime);
    CGRect windowFrame = _window.frame;
    [UIView animateWithDuration:0.25
                          delay:delay
                        options:0
                     animations:^{
                       _window.frame = CGRectOffset(windowFrame, 0, -windowFrame.size.height);
                     } completion:^(__unused BOOL finished) {
                       _window.frame = windowFrame;
                       _window.hidden = YES;
                       _window = nil;
                     }];
  });
}

- (void)showWithURL:(NSURL *)URL
{
  UIColor *color;
  UIColor *backgroundColor;
  NSString *source;
  if (URL.fileURL) {
    color = [UIColor grayColor];
    backgroundColor = [UIColor blackColor];
    source = @"pre-bundled file";
  } else {
    color = [UIColor whiteColor];
    backgroundColor = [UIColor colorWithHue:1./3 saturation:1 brightness:.35 alpha:1];
    source = [NSString stringWithFormat:@"%@:%@", URL.host, URL.port];
  }

  [self showMessage:[NSString stringWithFormat:@"Loading from %@...", source]
              color:color
    backgroundColor:backgroundColor];
}

@end

#else

@implementation RCTDevLoadingView

+ (NSString *)moduleName { return nil; }
+ (void)setEnabled:(BOOL)enabled { }

@end

#endif
