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

- (instancetype)init
{
  // We're only overriding this to ensure the module gets created at startup
  // TODO (t11106126): Remove once we have more declarative control over module setup.
  return [super init];
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

  if (bridge.loading) {
    [self showWithURL:bridge.bundleURL];
  }
}

RCT_EXPORT_METHOD(showMessage:(NSString *)message color:(UIColor *)color backgroundColor:(UIColor *)backgroundColor)
{
  if (!isEnabled) {
    return;
  }

  dispatch_async(dispatch_get_main_queue(), ^{
    self->_showDate = [NSDate date];
    if (!self->_window && !RCTRunningInTestEnvironment()) {
      CGFloat screenWidth = [UIScreen mainScreen].bounds.size.width;
      self->_window = [[UIWindow alloc] initWithFrame:CGRectMake(0, 0, screenWidth, 22)];
#if TARGET_OS_TV
      self->_window.windowLevel = UIWindowLevelNormal + 1;
#else
      self->_window.windowLevel = UIWindowLevelStatusBar + 1;
#endif
      // set a root VC so rotation is supported
      self->_window.rootViewController = [UIViewController new];

      self->_label = [[UILabel alloc] initWithFrame:self->_window.bounds];
      self->_label.font = [UIFont systemFontOfSize:12.0];
      self->_label.textAlignment = NSTextAlignmentCenter;

      [self->_window addSubview:self->_label];
    }

    self->_label.text = message;
    self->_label.textColor = color;
    self->_window.backgroundColor = backgroundColor;
    self->_window.hidden = NO;
  });
}

RCT_EXPORT_METHOD(hide)
{
  if (!isEnabled) {
    return;
  }

  dispatch_async(dispatch_get_main_queue(), ^{
    const NSTimeInterval MIN_PRESENTED_TIME = 0.6;
    NSTimeInterval presentedTime = [[NSDate date] timeIntervalSinceDate:self->_showDate];
    NSTimeInterval delay = MAX(0, MIN_PRESENTED_TIME - presentedTime);
    CGRect windowFrame = self->_window.frame;
    [UIView animateWithDuration:0.25
                          delay:delay
                        options:0
                     animations:^{
                       self->_window.frame = CGRectOffset(windowFrame, 0, -windowFrame.size.height);
                     } completion:^(__unused BOOL finished) {
                       self->_window.frame = windowFrame;
                       self->_window.hidden = YES;
                       self->_window = nil;
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

- (void)updateProgress:(RCTLoadingProgress *)progress
{
  if (!progress) {
    return;
  }
  dispatch_async(dispatch_get_main_queue(), ^{
    self->_label.text = [progress description];
  });
}

@end

#else

@implementation RCTDevLoadingView

+ (NSString *)moduleName { return nil; }
+ (void)setEnabled:(BOOL)enabled { }
- (void)updateProgress:(RCTLoadingProgress *)progress {}

@end

#endif
