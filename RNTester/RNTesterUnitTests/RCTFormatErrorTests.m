/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

#import <XCTest/XCTest.h>

#import <React/RCTAssert.h>

@interface RCTFormatErrorTests : XCTestCase

@end

@implementation RCTFormatErrorTests

- (void)testSymbolication {
  NSArray<NSDictionary<NSString *, id> *> *stackTrace = @[
    @{@"methodName": @"method_from_bundle", @"column": @11, @"lineNumber": @7, @"file": @"Fb4aBundle.js"},
    @{@"methodName": @"method_from_ram_bundle", @"column": @13, @"lineNumber": @18, @"file": @"199.js"},
    @{@"methodName": @"method_from_ram_bundle_with_address", @"column": @13, @"lineNumber": @18, @"file": @"address at 199.js"},
    @{@"methodName": @"method_from_segment", @"column": @18, @"lineNumber": @9, @"file": @"seg-1.js"},
    @{@"methodName": @"method_from_segment_with_address", @"column": @18, @"lineNumber": @9, @"file": @"address at seg-1.js"},
    @{@"methodName": @"method_from_ram_segment", @"column": @20, @"lineNumber": @10, @"file": @"seg-3_198.js"},
    @{@"methodName": @"method_from_ram_segment_with_address", @"column": @20, @"lineNumber": @10, @"file": @"address at seg-3_198.js"}
  ];
  NSString *message = RCTFormatError(@"Error", stackTrace, 0);
  XCTAssertEqualObjects(message, @"Error, stack:\n"
                        "method_from_bundle@7:11\n"
                        "method_from_ram_bundle@199.js:18:13\n"
                        "method_from_ram_bundle_with_address@199.js:18:13\n"
                        "method_from_segment@seg-1.js:9:18\n"
                        "method_from_segment_with_address@seg-1.js:9:18\n"
                        "method_from_ram_segment@seg-3_198.js:10:20\n"
                        "method_from_ram_segment_with_address@seg-3_198.js:10:20\n");
}

@end
