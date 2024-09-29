/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "UIResponder+React.h"

static __weak id reactCurrentFirstResponder;

@implementation UIResponder (React)
+ (id)reactCurrentFirstResponder
{
  reactCurrentFirstResponder = nil;
  [[UIApplication sharedApplication] sendAction:@selector(reactFindFirstResponder:) to:nil from:nil forEvent:nil];
  return reactCurrentFirstResponder;
}

- (void)reactFindFirstResponder:(id)sender
{
  reactCurrentFirstResponder = self;
}
@end
