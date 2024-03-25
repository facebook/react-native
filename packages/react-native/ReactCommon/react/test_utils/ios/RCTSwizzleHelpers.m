/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTSwizzleHelpers.h"

#import <objc/runtime.h>

void RCTSwizzleInstanceSelector(Class targetClass, Class swizzleClass, SEL selector)
{
  Method originalMethod = class_getInstanceMethod(targetClass, selector);
  Method swizzleMethod = class_getInstanceMethod(swizzleClass, selector);
  method_exchangeImplementations(originalMethod, swizzleMethod);
}
