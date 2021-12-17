/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTUtils.h>

#import "RCTAlertController.h"

@interface RCTAlertController ()

#if !TARGET_OS_OSX // [TODO(macOS GH#774)
@property (nonatomic, strong) UIWindow *alertWindow;
#endif // ]TODO(macOS GH#774)

@end

@implementation RCTAlertController

#if !TARGET_OS_OSX // [TODO(macOS GH#774)
- (UIWindow *)alertWindow
{
  if (_alertWindow == nil) {
    _alertWindow = [[UIWindow alloc] initWithFrame:RCTSharedApplication().keyWindow.bounds];
    _alertWindow.rootViewController = [UIViewController new];
    _alertWindow.windowLevel = UIWindowLevelAlert + 1;
  }
  return _alertWindow;
}

- (void)show:(BOOL)animated completion:(void (^)(void))completion
{
  [self.alertWindow makeKeyAndVisible];

  // [TODO(macOS GH#774)
  // If the window is tracked by our application then it will show the alert
  if ([[[UIApplication sharedApplication] windows] containsObject:self.alertWindow]) {
    [self.alertWindow.rootViewController presentViewController:self animated:animated completion:completion];
  } else {
    // When using Scenes, we must present the alert from a view controller associated with a window in the Scene. A fresh window (i.e. _alertWindow) cannot show the alert.
    [RCTPresentedViewController() presentViewController:self animated:animated completion:completion];
  }
  // TODO(macOS GH#774)]
}
#endif // ]TODO(macOS GH#774)

@end
