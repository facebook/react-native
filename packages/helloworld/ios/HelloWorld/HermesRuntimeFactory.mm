/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "HermesRuntimeFactory.h"

#import <ReactCommon/RCTHermesInstance.h>

@implementation HermesRuntimeFactory

+ (NSValue *)createJSRuntimeFactory
{
  facebook::react::JSRuntimeFactory *runtimeFactory = new facebook::react::RCTHermesInstance(nullptr, /* allocInOldGenBeforeTTI */ false);
  return [NSValue valueWithPointer:runtimeFactory];
}

@end
