/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTCxxUtils.h"

#import <React/RCTFollyConvert.h>

using namespace react::CxxUtils;

id RCTConvertFollyDynamic(const folly::dynamic &dyn) {
  return convertFollyDynamicToId(dyn);
}

@implementation RCTConvert (folly)

+ (folly::dynamic)folly_dynamic:(id)json;
{
  if (json == nil || json == (id)kCFNull) {
    return nullptr;
  } else {
    folly::dynamic dyn = convertIdToFollyDynamic(json);
     if (dyn == nil) {
       RCTAssert(false, @"RCTConvert input json is of an impossible type");
     }
     return dyn;
  }
}

@end
