/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <React/RCTConvert.h>
#include <folly/dynamic.h>

id RCTConvertFollyDynamic(const folly::dynamic &dyn);

@interface RCTConvert (folly)

+ (folly::dynamic)folly_dynamic:(id)json;

@end
