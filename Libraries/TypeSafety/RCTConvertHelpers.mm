/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTConvertHelpers.h"

#import <React/RCTConvert.h>

bool RCTBridgingToBool(id value)
{
  return [RCTConvert BOOL:value] ? true : false;
}

folly::Optional<bool> RCTBridgingToOptionalBool(id value)
{
  if (!RCTNilIfNull(value)) {
    return {};
  }
  return RCTBridgingToBool(value);
}

NSString *RCTBridgingToString(id value)
{
  return [RCTConvert NSString:RCTNilIfNull(value)];
}

NSString *RCTBridgingToOptionalString(id value)
{
  return RCTBridgingToString(value);
}


folly::Optional<double> RCTBridgingToOptionalDouble(id value)
{
  if (!RCTNilIfNull(value)) {
    return {};
  }
  return RCTBridgingToDouble(value);
}

double RCTBridgingToDouble(id value)
{
  return [RCTConvert double:value];
}

NSArray *RCTBridgingToArray(id value) {
  return [RCTConvert NSArray:value];
}
