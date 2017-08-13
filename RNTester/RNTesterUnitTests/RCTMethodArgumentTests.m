/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */

#import <UIKit/UIKit.h>
#import <XCTest/XCTest.h>

#import <React/RCTModuleMethod.h>

@interface RCTMethodArgumentTests : XCTestCase

@end

@implementation RCTMethodArgumentTests

extern SEL RCTParseMethodSignature(const char *methodSignature, NSArray **argTypes);

- (void)testOneArgument
{
  NSArray *arguments;
  const char *methodSignature = "foo:(NSInteger)foo";
  SEL selector = RCTParseMethodSignature(methodSignature, &arguments);
  XCTAssertEqualObjects(NSStringFromSelector(selector), @"foo:");
  XCTAssertEqual(arguments.count, (NSUInteger)1);
  XCTAssertEqualObjects(((RCTMethodArgument *)arguments[0]).type, @"NSInteger");
}

- (void)testTwoArguments
{
  NSArray *arguments;
  const char *methodSignature = "foo:(NSInteger)foo bar:(BOOL)bar";
  SEL selector = RCTParseMethodSignature(methodSignature, &arguments);
  XCTAssertEqualObjects(NSStringFromSelector(selector), @"foo:bar:");
  XCTAssertEqual(arguments.count, (NSUInteger)2);
  XCTAssertEqualObjects(((RCTMethodArgument *)arguments[0]).type, @"NSInteger");
  XCTAssertEqualObjects(((RCTMethodArgument *)arguments[1]).type, @"BOOL");
}

- (void)testSpaces
{
  NSArray *arguments;
  const char *methodSignature = "foo : (NSInteger)foo bar : (BOOL) bar";
  SEL selector = RCTParseMethodSignature(methodSignature, &arguments);
  XCTAssertEqualObjects(NSStringFromSelector(selector), @"foo:bar:");
  XCTAssertEqual(arguments.count, (NSUInteger)2);
  XCTAssertEqualObjects(((RCTMethodArgument *)arguments[0]).type, @"NSInteger");
  XCTAssertEqualObjects(((RCTMethodArgument *)arguments[1]).type, @"BOOL");
}

- (void)testNewlines
{
  NSArray *arguments;
  const char *methodSignature = "foo : (NSInteger)foo\nbar : (BOOL) bar";
  SEL selector = RCTParseMethodSignature(methodSignature, &arguments);
  XCTAssertEqualObjects(NSStringFromSelector(selector), @"foo:bar:");
  XCTAssertEqual(arguments.count, (NSUInteger)2);
  XCTAssertEqualObjects(((RCTMethodArgument *)arguments[0]).type, @"NSInteger");
  XCTAssertEqualObjects(((RCTMethodArgument *)arguments[1]).type, @"BOOL");
}

- (void)testUnnamedArgs
{
  NSArray *arguments;
  const char *methodSignature = "foo:(NSInteger)foo:(BOOL)bar";
  SEL selector = RCTParseMethodSignature(methodSignature, &arguments);
  XCTAssertEqualObjects(NSStringFromSelector(selector), @"foo::");
  XCTAssertEqual(arguments.count, (NSUInteger)2);
  XCTAssertEqualObjects(((RCTMethodArgument *)arguments[0]).type, @"NSInteger");
  XCTAssertEqualObjects(((RCTMethodArgument *)arguments[1]).type, @"BOOL");
}

- (void)testUntypedUnnamedArgs
{
  NSArray *arguments;
  const char *methodSignature = "foo:foo:bar:bar";
  SEL selector = RCTParseMethodSignature(methodSignature, &arguments);
  XCTAssertEqualObjects(NSStringFromSelector(selector), @"foo:::");
  XCTAssertEqual(arguments.count, (NSUInteger)3);
  XCTAssertEqualObjects(((RCTMethodArgument *)arguments[0]).type, @"id");
  XCTAssertEqualObjects(((RCTMethodArgument *)arguments[1]).type, @"id");
  XCTAssertEqualObjects(((RCTMethodArgument *)arguments[2]).type, @"id");
}

- (void)testAttributes
{
  NSArray *arguments;
  const char *methodSignature = "foo:(__attribute__((unused)) NSString *)foo bar:(__unused BOOL)bar";
  SEL selector = RCTParseMethodSignature(methodSignature, &arguments);
  XCTAssertEqualObjects(NSStringFromSelector(selector), @"foo:bar:");
  XCTAssertEqual(arguments.count, (NSUInteger)2);
  XCTAssertEqualObjects(((RCTMethodArgument *)arguments[0]).type, @"NSString");
  XCTAssertEqualObjects(((RCTMethodArgument *)arguments[1]).type, @"BOOL");
}

- (void)testNullability
{
  NSArray *arguments;
  const char *methodSignature = "foo:(nullable NSString *)foo bar:(nonnull NSNumber *)bar baz:(id)baz";
  SEL selector = RCTParseMethodSignature(methodSignature, &arguments);
  XCTAssertEqualObjects(NSStringFromSelector(selector), @"foo:bar:baz:");
  XCTAssertEqual(arguments.count, (NSUInteger)3);
  XCTAssertEqualObjects(((RCTMethodArgument *)arguments[0]).type, @"NSString");
  XCTAssertEqualObjects(((RCTMethodArgument *)arguments[1]).type, @"NSNumber");
  XCTAssertEqualObjects(((RCTMethodArgument *)arguments[2]).type, @"id");
  XCTAssertEqual(((RCTMethodArgument *)arguments[0]).nullability, RCTNullable);
  XCTAssertEqual(((RCTMethodArgument *)arguments[1]).nullability, RCTNonnullable);
  XCTAssertEqual(((RCTMethodArgument *)arguments[2]).nullability, RCTNullabilityUnspecified);
}

- (void)testSemicolonStripping
{
  NSArray *arguments;
  const char *methodSignature = "foo:(NSString *)foo bar:(BOOL)bar;";
  SEL selector = RCTParseMethodSignature(methodSignature, &arguments);
  XCTAssertEqualObjects(NSStringFromSelector(selector), @"foo:bar:");
  XCTAssertEqual(arguments.count, (NSUInteger)2);
  XCTAssertEqualObjects(((RCTMethodArgument *)arguments[0]).type, @"NSString");
  XCTAssertEqualObjects(((RCTMethodArgument *)arguments[1]).type, @"BOOL");
}

- (void)testUnused
{
  NSArray *arguments;
  const char *methodSignature = "foo:(__unused NSString *)foo bar:(NSNumber *)bar";
  SEL selector = RCTParseMethodSignature(methodSignature, &arguments);
  XCTAssertEqualObjects(NSStringFromSelector(selector), @"foo:bar:");
  XCTAssertEqual(arguments.count, (NSUInteger)2);
  XCTAssertEqualObjects(((RCTMethodArgument *)arguments[0]).type, @"NSString");
  XCTAssertEqualObjects(((RCTMethodArgument *)arguments[1]).type, @"NSNumber");
  XCTAssertTrue(((RCTMethodArgument *)arguments[0]).unused);
  XCTAssertFalse(((RCTMethodArgument *)arguments[1]).unused);
}

- (void)testGenericArray
{
  NSArray *arguments;
  const char *methodSignature = "foo:(NSArray<NSString *> *)foo;";
  SEL selector = RCTParseMethodSignature(methodSignature, &arguments);
  XCTAssertEqualObjects(NSStringFromSelector(selector), @"foo:");
  XCTAssertEqual(arguments.count, (NSUInteger)1);
  XCTAssertEqualObjects(((RCTMethodArgument *)arguments[0]).type, @"NSStringArray");
}

- (void)testNestedGenericArray
{
  NSArray *arguments;
  const char *methodSignature = "foo:(NSArray<NSArray<NSString *> *> *)foo;";
  SEL selector = RCTParseMethodSignature(methodSignature, &arguments);
  XCTAssertEqualObjects(NSStringFromSelector(selector), @"foo:");
  XCTAssertEqual(arguments.count, (NSUInteger)1);
  XCTAssertEqualObjects(((RCTMethodArgument *)arguments[0]).type, @"NSStringArrayArray");
}

- (void)testGenericSet
{
  NSArray *arguments;
  const char *methodSignature = "foo:(NSSet<NSNumber *> *)foo;";
  SEL selector = RCTParseMethodSignature(methodSignature, &arguments);
  XCTAssertEqualObjects(NSStringFromSelector(selector), @"foo:");
  XCTAssertEqual(arguments.count, (NSUInteger)1);
  XCTAssertEqualObjects(((RCTMethodArgument *)arguments[0]).type, @"NSNumberSet");
}

- (void)testGenericDictionary
{
  NSArray *arguments;
  const char *methodSignature = "foo:(NSDictionary<NSString *, NSNumber *> *)foo;";
  SEL selector = RCTParseMethodSignature(methodSignature, &arguments);
  XCTAssertEqualObjects(NSStringFromSelector(selector), @"foo:");
  XCTAssertEqual(arguments.count, (NSUInteger)1);
  XCTAssertEqualObjects(((RCTMethodArgument *)arguments[0]).type, @"NSNumberDictionary");
}

@end
