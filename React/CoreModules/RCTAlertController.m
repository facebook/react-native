/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTUtils.h>

#import "RCTAlertController.h"

@interface RCTAlertController ()

@property (nonatomic, strong) UIWindow *alertWindow;

@end

@implementation RCTAlertController

- (UIWindow *)alertWindow
{
  if (_alertWindow == nil) {
      if (@available(iOS 13, *)) {
        UIWindowScene *windowScene = [self windowScene];
        if (windowScene != nil) {
          _alertWindow = [[UIWindow alloc] initWithWindowScene:windowScene];
        }
    }
    if (_alertWindow == nil) {
      _alertWindow = [[UIWindow alloc] initWithFrame:RCTSharedApplication().keyWindow.bounds];
    }
    _alertWindow.rootViewController = [UIViewController new];
    _alertWindow.windowLevel = UIWindowLevelAlert + 1;
  }
  return _alertWindow;
}

- (void)show:(BOOL)animated completion:(void (^)(void))completion
{
  [self.alertWindow makeKeyAndVisible];
  [self.alertWindow.rootViewController presentViewController:self animated:animated completion:completion];
}

- (void)hide
{
  _alertWindow = nil;
}

- (UIWindowScene * _Nullable)windowScene API_AVAILABLE(ios(13))
{
    NSSet<UIScene *> *connectedScenes = RCTSharedApplication().connectedScenes;
    for (UIScene *scene in connectedScenes) {
        BOOL isActive = scene.activationState == UISceneActivationStateForegroundActive;
        BOOL isWindowScene = [scene isKindOfClass: [UIWindowScene class]];
        if (isActive && isWindowScene) {
            return (UIWindowScene *) scene;
        }
    }
    return nil;
}

@end
