/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTUtils.h>

#import "RCTPausedInDebuggerOverlayController.h"

@interface RCTPausedInDebuggerOverlayController ()

@property (nonatomic, strong) UIWindow *alertWindow;
@property (nonatomic, strong) UIAlertController *alertController;

@end

@implementation RCTPausedInDebuggerOverlayController

- (UIWindow *)alertWindow
{
  if (_alertWindow == nil) {
    _alertWindow = [[UIWindow alloc] initWithWindowScene:RCTKeyWindow().windowScene];

    if (_alertWindow) {
      _alertWindow.rootViewController = [UIViewController new];
      _alertWindow.windowLevel = UIWindowLevelAlert + 1;
    }
  }

  return _alertWindow;
}

- (void)showWithMessage:(NSString *)message onResume:(void (^)(void))onResume onStepOver:(void (^)(void))onStepOver
{
  [self hide];
  _alertController = [UIAlertController alertControllerWithTitle:nil
                                                         message:message
                                                  preferredStyle:UIAlertControllerStyleAlert];
  [_alertController addAction:[UIAlertAction actionWithTitle:@"Resume"
                                                       style:UIAlertActionStyleDefault
                                                     handler:^(UIAlertAction *action) {
                                                       onResume();
                                                     }]];
  [_alertController addAction:[UIAlertAction actionWithTitle:@"Step Over"
                                                       style:UIAlertActionStyleDefault
                                                     handler:^(UIAlertAction *action) {
                                                       onStepOver();
                                                     }]];
  [self.alertWindow makeKeyAndVisible];
  [self.alertWindow.rootViewController presentViewController:_alertController animated:YES completion:nil];
}

- (void)hide
{
  [_alertWindow setHidden:YES];

  _alertWindow.windowScene = nil;

  _alertWindow = nil;

  _alertController = nil;
}

@end
