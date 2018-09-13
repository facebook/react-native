/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

#import <UIKit/UIKit.h>
#import <XCTest/XCTest.h>

#import <React/RCTModuleMethod.h>

@interface RCTMethodArgumentTests : XCTestCase

@end

@implementation RCTMethodArgumentTests

extern NSString *RCTParseMethodSignature(const char *methodSignature, NSArray **argTypes);

- (void)testOneArgument
{
  NSArray *arguments;
  const char *methodSignature = "foo:(NSInteger)foo";
  NSString *selector = RCTParseMethodSignature(methodSignature, &arguments);
  XCTAssertEqualObjects(selector, @"foo:");
  XCTAssertEqual(arguments.count, (NSUInteger)1);
  XCTAssertEqualObjects(((RCTMethodArgument *)arguments[0]).type, @"NSInteger");
}

- (void)testTwoArguments
{
  NSArray *arguments;
  const char *methodSignature = "foo:(NSInteger)foo bar:(BOOL)bar";
  NSString *selector = RCTParseMethodSignature(methodSignature, &arguments);
  XCTAssertEqualObjects(selector, @"foo:bar:");
  XCTAssertEqual(arguments.count, (NSUInteger)2);
  XCTAssertEqualObjects(((RCTMethodArgument *)arguments[0]).type, @"NSInteger");
  XCTAssertEqualObjects(((RCTMethodArgument *)arguments[1]).type, @"BOOL");
}

- (void)testSpaces
{
  NSArray *arguments;
  const char *methodSignature = "foo : (NSInteger)foo bar : (BOOL) bar";
  NSString *selector = RCTParseMethodSignature(methodSignature, &arguments);
  XCTAssertEqualObjects(selector, @"foo:bar:");
  XCTAssertEqual(arguments.count, (NSUInteger)2);
  XCTAssertEqualObjects(((RCTMethodArgument *)arguments[0]).type, @"NSInteger");
  XCTAssertEqualObjects(((RCTMethodArgument *)arguments[1]).type, @"BOOL");
}

- (void)testNewlines
{
  NSArray *arguments;
  const char *methodSignature = "foo : (NSInteger)foo\nbar : (BOOL) bar";
  NSString *selector = RCTParseMethodSignature(methodSignature, &arguments);
  XCTAssertEqualObjects(selector, @"foo:bar:");
  XCTAssertEqual(arguments.count, (NSUInteger)2);
  XCTAssertEqualObjects(((RCTMethodArgument *)arguments[0]).type, @"NSInteger");
  XCTAssertEqualObjects(((RCTMethodArgument *)arguments[1]).type, @"BOOL");
}

- (void)testUnnamedArgs
{
  NSArray *arguments;
  const char *methodSignature = "foo:(NSInteger)foo:(BOOL)bar";
  NSString *selector = RCTParseMethodSignature(methodSignature, &arguments);
  XCTAssertEqualObjects(selector, @"foo::");
  XCTAssertEqual(arguments.count, (NSUInteger)2);
  XCTAssertEqualObjects(((RCTMethodArgument *)arguments[0]).type, @"NSInteger");
  XCTAssertEqualObjects(((RCTMethodArgument *)arguments[1]).type, @"BOOL");
}

- (void)testUntypedUnnamedArgs
{
  NSArray *arguments;
  const char *methodSignature = "foo:foo:bar:bar";
  NSString *selector = RCTParseMethodSignature(methodSignature, &arguments);
  XCTAssertEqualObjects(selector, @"foo:::");
  XCTAssertEqual(arguments.count, (NSUInteger)3);
  XCTAssertEqualObjects(((RCTMethodArgument *)arguments[0]).type, @"id");
  XCTAssertEqualObjects(((RCTMethodArgument *)arguments[1]).type, @"id");
  XCTAssertEqualObjects(((RCTMethodArgument *)arguments[2]).type, @"id");
}

- (void)testNamespacedCxxStruct
{
  NSArray *arguments;
  const char *methodSignature = "foo:(foo::type &)foo bar:(bar::type &)bar";
  NSString *selector = RCTParseMethodSignature(methodSignature, &arguments);
  XCTAssertEqualObjects(selector, @"foo:bar:");
  XCTAssertEqual(arguments.count, (NSUInteger)2);
  XCTAssertEqualObjects(((RCTMethodArgument *)arguments[0]).type, @"foo::type");
  XCTAssertEqualObjects(((RCTMethodArgument *)arguments[1]).type, @"bar::type");
}

- (void)testAttributes
{
  NSArray *arguments;
  const char *methodSignature = "foo:(__attribute__((unused)) NSString *)foo bar:(__unused BOOL)bar";
  NSString *selector = RCTParseMethodSignature(methodSignature, &arguments);
  XCTAssertEqualObjects(selector, @"foo:bar:");
  XCTAssertEqual(arguments.count, (NSUInteger)2);
  XCTAssertEqualObjects(((RCTMethodArgument *)arguments[0]).type, @"NSString");
  XCTAssertEqualObjects(((RCTMethodArgument *)arguments[1]).type, @"BOOL");
}

- (void)testNullability
{
  NSArray *arguments;
  const char *methodSignature = "foo:(nullable NSString *)foo bar:(nonnull NSNumber *)bar baz:(id)baz";
  NSString *selector = RCTParseMethodSignature(methodSignature, &arguments);
  XCTAssertEqualObjects(selector, @"foo:bar:baz:");
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
  NSString *selector = RCTParseMethodSignature(methodSignature, &arguments);
  XCTAssertEqualObjects(selector, @"foo:bar:");
  XCTAssertEqual(arguments.count, (NSUInteger)2);
  XCTAssertEqualObjects(((RCTMethodArgument *)arguments[0]).type, @"NSString");
  XCTAssertEqualObjects(((RCTMethodArgument *)arguments[1]).type, @"BOOL");
}

- (void)testUnused
{
  NSArray *arguments;
  const char *methodSignature = "foo:(__unused NSString *)foo bar:(NSNumber *)bar";
  NSString *selector = RCTParseMethodSignature(methodSignature, &arguments);
  XCTAssertEqualObjects(selector, @"foo:bar:");
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
  NSString *selector = RCTParseMethodSignature(methodSignature, &arguments);
  XCTAssertEqualObjects(selector, @"foo:");
  XCTAssertEqual(arguments.count, (NSUInteger)1);
  XCTAssertEqualObjects(((RCTMethodArgument *)arguments[0]).type, @"NSStringArray");
}

- (void)testNestedGenericArray
{
  NSArray *arguments;
  const char *methodSignature = "foo:(NSArray<NSArray<NSString *> *> *)foo;";
  NSString *selector = RCTParseMethodSignature(methodSignature, &arguments);
  XCTAssertEqualObjects(selector, @"foo:");
  XCTAssertEqual(arguments.count, (NSUInteger)1);
  XCTAssertEqualObjects(((RCTMethodArgument *)arguments[0]).type, @"NSStringArrayArray");
}

- (void)testGenericSet
{
  NSArray *arguments;
  const char *methodSignature = "foo:(NSSet<NSNumber *> *)foo;";
  NSString *selector = RCTParseMethodSignature(methodSignature, &arguments);
  XCTAssertEqualObjects(selector, @"foo:");
  XCTAssertEqual(arguments.count, (NSUInteger)1);
  XCTAssertEqualObjects(((RCTMethodArgument *)arguments[0]).type, @"NSNumberSet");
}

- (void)testGenericDictionary
{
  NSArray *arguments;
  const char *methodSignature = "foo:(NSDictionary<NSString *, NSNumber *> *)foo;";
  NSString *selector = RCTParseMethodSignature(methodSignature, &arguments);
  XCTAssertEqualObjects(selector, @"foo:");
  XCTAssertEqual(arguments.count, (NSUInteger)1);
  XCTAssertEqualObjects(((RCTMethodArgument *)arguments[0]).type, @"NSNumberDictionary");
}

@end
