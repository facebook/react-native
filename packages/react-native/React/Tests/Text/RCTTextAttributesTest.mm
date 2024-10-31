/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>
#import <XCTest/XCTest.h>

#import <React/RCTTextAttributes.h>

@interface RCTTextAttributesTest : XCTestCase

@end

@implementation RCTTextAttributesTest

- (void)testCapitalize
{
  RCTTextAttributes *attrs = [RCTTextAttributes new];
  attrs.textTransform = RCTTextTransformCapitalize;

  NSString *input = @"hello WORLD from ReAcT nAtIvE 2a !b c";
  NSString *output = @"Hello WORLD From ReAcT NAtIvE 2a !B C";
  XCTAssertEqualObjects([attrs applyTextAttributesToText:input], output);
}

- (void)testUppercase
{
  RCTTextAttributes *attrs = [RCTTextAttributes new];
  attrs.textTransform = RCTTextTransformUppercase;

  NSString *input = @"hello WORLD from ReAcT nAtIvE 2a !b c";
  NSString *output = @"HELLO WORLD FROM REACT NATIVE 2A !B C";
  XCTAssertEqualObjects([attrs applyTextAttributesToText:input], output);
}

- (void)testLowercase
{
  RCTTextAttributes *attrs = [RCTTextAttributes new];
  attrs.textTransform = RCTTextTransformLowercase;

  NSString *input = @"hello WORLD from ReAcT nAtIvE 2a !b c";
  NSString *output = @"hello world from react native 2a !b c";
  XCTAssertEqualObjects([attrs applyTextAttributesToText:input], output);
}

@end
