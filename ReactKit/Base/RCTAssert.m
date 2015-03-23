/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTAssert.h"

RCTAssertFunction RCTInjectedAssertFunction = nil;
RCTAssertFunction RCTInjectedCAssertFunction = nil;

void RCTInjectAssertFunctions(RCTAssertFunction assertFunction, RCTAssertFunction cAssertFunction)
{
  RCTInjectedAssertFunction = assertFunction;
  RCTInjectedCAssertFunction = cAssertFunction;
}
