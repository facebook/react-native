/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTUtils.h>

#import <React/RCTAlertController.h>

@implementation RCTAlertController

- (void)show:(BOOL)animated completion:(void (^)(void))completion
{
  UIWindow *keyWindow = RCTKeyWindow();
  
  UIUserInterfaceStyle style = self.overrideUserInterfaceStyle;
  if (style == UIUserInterfaceStyleUnspecified) {
    UIUserInterfaceStyle overriddenStyle = keyWindow.overrideUserInterfaceStyle;
    style = overriddenStyle ? overriddenStyle : UIUserInterfaceStyleUnspecified;
  }

  self.overrideUserInterfaceStyle = style;

  [keyWindow.rootViewController presentViewController:self animated:animated completion:completion];
}

- (void)hide
{
  [self dismissViewControllerAnimated:YES completion:nil];
}

@end
