/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <objc/runtime.h>
#import "NSAttributedString+EmptyStringWithAttributes.h"

@implementation NSAttributedString (EmptyStringWithAttributes)

- (BOOL)isEmptyStringWithAttributes
{
  NSNumber *value = objc_getAssociatedObject(self, @selector(isEmptyStringWithAttributes));
  if (value) {
    return [value boolValue];
  }
  return false;
}

- (void)setIsEmptyStringWithAttributes:(BOOL)isEmptyStringWithAttributes
{
  objc_setAssociatedObject(self, @selector(isEmptyStringWithAttributes), [NSNumber numberWithBool:isEmptyStringWithAttributes], OBJC_ASSOCIATION_ASSIGN);
}

@end
