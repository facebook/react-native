/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

#import "CrashyCrash.h"


@implementation CrashyCrash

RCT_EXPORT_MODULE();

RCT_EXPORT_METHOD(letsCrash)
{
  NSArray *a = @[@"wow"];
  NSString *s = [a objectAtIndex:42]; // native crash here
  NSLog(@"%@", s);
}

@end
