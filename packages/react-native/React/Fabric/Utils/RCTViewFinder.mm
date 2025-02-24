/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTViewFinder.h"
#include <React/RCTViewComponentView.h>

@implementation RCTViewFinder

+ (UIView *)findView:(UIView *)root withNativeId:(NSString *)nativeId
{
  if (!nativeId) {
    return nil;
  }

  if ([root isKindOfClass:[RCTViewComponentView class]] &&
      [nativeId isEqualToString:((RCTViewComponentView *)root).nativeId]) {
    return root;
  }

  for (UIView *subview in root.subviews) {
    UIView *result = [RCTViewFinder findView:subview withNativeId:nativeId];
    if (result) {
      return result;
    }
  }

  return nil;
}

@end
