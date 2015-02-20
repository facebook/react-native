// Copyright 2004-present Facebook. All Rights Reserved.

#import "RCTAssert.h"

RCTAssertFunction RCTInjectedAssertFunction = nil;
RCTAssertFunction RCTInjectedCAssertFunction = nil;

void RCTInjectAssertFunctions(RCTAssertFunction assertFunction, RCTAssertFunction cAssertFunction)
{
  RCTInjectedAssertFunction = assertFunction;
  RCTInjectedCAssertFunction = cAssertFunction;
}
