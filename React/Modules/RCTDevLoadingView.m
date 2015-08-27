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

#if RCT_DEV

@implementation RCTDevLoadingView
{
  UIWindow *_window;
  UILabel *_label;
  NSDate *_showDate;
}

@synthesize bridge = _bridge;

RCT_EXPORT_MODULE()

- (instancetype)init
{
  if ((self = [super init])) {

    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(hide)
                                                 name:RCTJavaScriptDidLoadNotification
                                               object:nil];

    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(hide)
                                                 name:RCTJavaScriptDidFailToLoadNotification
                                               object:nil];
  }
  return self;
}

- (void)dealloc
{
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

- (void)setBridge:(RCTBridge *)bridge
{
  _bridge = bridge;
  [self showWithURL:bridge.bundleURL];
}

- (void)showWithURL:(NSURL *)URL
{
  dispatch_async(dispatch_get_main_queue(), ^{

    _showDate = [NSDate date];
    if (!_window && !RCTRunningInTestEnvironment()) {
      CGFloat screenWidth = [UIScreen mainScreen].bounds.size.width;
      _window = [[UIWindow alloc] initWithFrame:CGRectMake(0, 0, screenWidth, 22)];
      _window.backgroundColor = [UIColor blackColor];
      _window.windowLevel = UIWindowLevelStatusBar + 1;

      _label = [[UILabel alloc] initWithFrame:_window.bounds];
      _label.font = [UIFont systemFontOfSize:12.0];
      _label.textColor = [UIColor grayColor];
      _label.textAlignment = NSTextAlignmentCenter;

      [_window addSubview:_label];
      [_window makeKeyAndVisible];
    }

    NSString *source;
    if (URL.fileURL) {
      source = @"pre-bundled file";
    } else {
      source = [NSString stringWithFormat:@"%@:%@", URL.host, URL.port];
    }

    _label.text = [NSString stringWithFormat:@"Loading from %@...", source];
    _window.hidden = NO;

  });
}

- (void)hide
{
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

@end

#else

@implementation RCTDevLoadingView

+ (NSString *)moduleName { return nil; }

@end

#endif
