/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTURLRequestHandlerProvider.h"

@implementation RCTURLRequestHandlerProvider : NSObject

+ (NSArray<NSString *> *)customURLRequestHandlerClassNames
{
  return @[
    // The content of this array is codegenerated reading the
    // codegenConfig.ios.customURLRequestHandler array
    // e.g.:
    @"MyCustomURLRequestHandler",
  ];
}

@end
