/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTTypedModuleConstants.h"

#import <React/RCTDefines.h>

@implementation _RCTTypedModuleConstants {
  NSDictionary *_dictionary;
}

+ (instancetype)newWithUnsafeDictionary:(NSDictionary<NSString *, id> *)dictionary
{
  _RCTTypedModuleConstants *constants = [self new];
  if (constants != nullptr) {
    constants->_dictionary = dictionary;
  }
  return constants;
}

#pragma mark - NSDictionary subclass

// See subclassing notes in
// https://developer.apple.com/documentation/foundation/nsdictionary#//apple_ref/occ/cl/NSDictionary

RCT_NOT_IMPLEMENTED(-(instancetype)initWithObjects : (id _Nonnull const[])
                        objects forKeys : (id<NSCopying> _Nonnull const[])keys count : (NSUInteger)count)

- (NSUInteger)count
{
  return [_dictionary count];
}

- (id)objectForKey:(id)key
{
  return [_dictionary objectForKey:key];
}

- (NSEnumerator *)keyEnumerator
{
  return [_dictionary keyEnumerator];
}

@end
