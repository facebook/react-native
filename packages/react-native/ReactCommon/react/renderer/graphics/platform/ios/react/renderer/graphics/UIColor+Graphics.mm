/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <objc/runtime.h>
#import "UIColor+Graphics.h"

@implementation UIColor (Graphics)

- (int32_t)reactHash
{
  return [objc_getAssociatedObject(self, _cmd) intValue];
}

- (void)setReactHash:(int32_t)reactHash
{
  objc_setAssociatedObject(self, @selector(reactHash), @(reactHash), OBJC_ASSOCIATION_RETAIN_NONATOMIC);
}

@end
