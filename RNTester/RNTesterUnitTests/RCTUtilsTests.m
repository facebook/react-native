/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

#import <XCTest/XCTest.h>

#import <React/RCTLog.h>
#import <React/RCTUtils.h>

static NSString * RCTLogsError(void (^block)(void))
{
  __block NSString* loggedMessage = @"";
  __block BOOL loggedError = NO;
  RCTPerformBlockWithLogFunction(block, ^(RCTLogLevel level,
                                          __unused RCTLogSource source,
                                          __unused NSString *fileName,
                                          __unused NSNumber *lineNumber,
                                          NSString *message) {
    loggedError = (level == RCTLogLevelError);
    loggedMessage = message;
  });
  if (loggedError) {
    return loggedMessage;
  }
  return nil;
}


@interface RCTUtilsTests : XCTestCase

@end

@implementation RCTUtilsTests

- (void)testRCTHumanReadableType
{
  XCTAssertEqualObjects(RCTHumanReadableType(@"str"), @"string");
  XCTAssertEqualObjects(RCTHumanReadableType([NSNumber numberWithInt:4]), @"number");

  // If we could detect that this was definitely a boolean and not a number that would be ideal
  // That seems difficult in ObjC though
  XCTAssertEqualObjects(RCTHumanReadableType(@(YES)), @"boolean or number");
  XCTAssertEqualObjects(RCTHumanReadableType(@(NO)), @"boolean or number");
  // These ideally would just say number
  XCTAssertEqualObjects(RCTHumanReadableType([NSNumber numberWithInt:0]), @"boolean or number");
  XCTAssertEqualObjects(RCTHumanReadableType([NSNumber numberWithInt:1]), @"boolean or number");
}

- (void)testRCTValidateTypeOfViewCommandArgument
{
  XCTAssertEqualObjects(RCTLogsError(^{
    RCTValidateTypeOfViewCommandArgument(@"str", [NSNumber class], @"number", @"ScrollView", @"scrollTo", @"2nd");
  }), @"ScrollView command scrollTo received 2nd argument of type string, expected number.");

  XCTAssertEqualObjects(RCTLogsError(^{
    RCTValidateTypeOfViewCommandArgument(@"str", [NSString class], @"string", @"ScrollView", @"scrollTo", @"1st");
  }), nil);
}

@end
