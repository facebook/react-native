/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTAssert.h"

NSString *const RCTErrorDomain = @"RCTErrorDomain";

RCTAssertFunction RCTCurrentAssertFunction = nil;

void _RCTAssertFormat(
  BOOL condition,
  const char *fileName,
  int lineNumber,
  const char *function,
  NSString *format, ...)
{
  if (RCTCurrentAssertFunction) {

    va_list args;
    va_start(args, format);
    NSString *message = [[NSString alloc] initWithFormat:format arguments:args];
    va_end(args);

    RCTCurrentAssertFunction(
      condition, @(fileName), @(lineNumber), @(function), message
    );
  }
}

void RCTSetAssertFunction(RCTAssertFunction assertFunction)
{
  RCTCurrentAssertFunction = assertFunction;
}

RCTAssertFunction RCTGetAssertFunction(void)
{
  return RCTCurrentAssertFunction;
}

void RCTAddAssertFunction(RCTAssertFunction assertFunction)
{
  RCTAssertFunction existing = RCTCurrentAssertFunction;
  if (existing) {
    RCTCurrentAssertFunction = ^(BOOL condition,
                                 NSString *fileName,
                                 NSNumber *lineNumber,
                                 NSString *function,
                                 NSString *message) {

      existing(condition, fileName, lineNumber, function, message);
      assertFunction(condition, fileName, lineNumber, function, message);
    };
  } else {
    RCTCurrentAssertFunction = assertFunction;
  }
}
