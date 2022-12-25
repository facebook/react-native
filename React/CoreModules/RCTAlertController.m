/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTUtils.h>

#import <React/RCTAlertController.h>

@interface RCTAlertController ()

@property (nonatomic, strong) UIWindow *alertWindow;

@end

@implementation RCTAlertController

- (UIWindow *)alertWindow
{
  if (_alertWindow == nil) {
#if defined(__IPHONE_OS_VERSION_MAX_ALLOWED) && defined(__IPHONE_13_0) && \
    __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_13_0
    if (@available(iOS 13.0, *)) {
      for (UIScene *scene in RCTSharedApplication().connectedScenes) {
        if (scene.activationState == UISceneActivationStateForegroundActive && [scene isKindOfClass:[UIWindowScene class]]) {
          _alertWindow = [[UIWindow alloc] initWithWindowScene:(UIWindowScene *)scene];
          break;
        }
      }
    }
#endif

    if (_alertWindow == nil) {
      UIWindow *keyWindow = RCTSharedApplication().keyWindow;
      if (keyWindow) {
        _alertWindow = [[UIWindow alloc] initWithFrame:keyWindow.bounds];
      } else {
        // keyWindow is nil, so we cannot create and initialize _alertWindow
        NSLog(@"Unable to create alert window: keyWindow is nil");
      }
    }

    if (_alertWindow) {
      _alertWindow.rootViewController = [UIViewController new];
      _alertWindow.windowLevel = UIWindowLevelAlert + 1;
    }
  }

  return _alertWindow;
}

- (void)show:(BOOL)animated completion:(void (^)(void))completion
{
  if (@available(iOS 13.0, *)) {
    UIUserInterfaceStyle style =
        RCTSharedApplication().delegate.window.overrideUserInterfaceStyle ?: UIUserInterfaceStyleUnspecified;
    self.overrideUserInterfaceStyle = style;
  }
  [self.alertWindow makeKeyAndVisible];
  [self.alertWindow.rootViewController presentViewController:self animated:animated completion:completion];
}

- (void)hide
{
  [_alertWindow setHidden:YES];

  if (@available(iOS 13, *)) {
    _alertWindow.windowScene = nil;
  }

  _alertWindow = nil;
}

@end
