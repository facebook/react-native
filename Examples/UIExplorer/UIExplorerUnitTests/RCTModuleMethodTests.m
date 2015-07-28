//
//  RCTModuleMethodTests.m
//  UIExplorer
//
//  Created by Nick Lockwood on 28/07/2015.
//  Copyright (c) 2015 Facebook. All rights reserved.
//

#import <UIKit/UIKit.h>
#import <XCTest/XCTest.h>

#import "RCTModuleMethod.h"

@interface RCTModuleMethodTests : XCTestCase

@end

@implementation RCTModuleMethodTests

extern void RCTParseObjCMethodName(NSString **objCMethodName, NSArray **argTypes);

- (void)testOneArgument
{
  NSArray *argTypes;
  NSString *methodName = @"foo:(NSInteger)foo";
  RCTParseObjCMethodName(&methodName, &argTypes);
  XCTAssertEqualObjects(methodName, @"foo:");
  XCTAssertEqual(argTypes.count, (NSUInteger)1);
  XCTAssertEqualObjects(argTypes[0], @"NSInteger");
}

- (void)testTwoArguments
{
  NSArray *argTypes;
  NSString *methodName = @"foo:(NSInteger)foo bar:(BOOL)bar";
  RCTParseObjCMethodName(&methodName, &argTypes);
  XCTAssertEqualObjects(methodName, @"foo:bar:");
  XCTAssertEqual(argTypes.count, (NSUInteger)2);
  XCTAssertEqualObjects(argTypes[0], @"NSInteger");
  XCTAssertEqualObjects(argTypes[1], @"BOOL");
}

- (void)testSpaces
{
  NSArray *argTypes;
  NSString *methodName = @"foo : (NSInteger)foo bar : (BOOL) bar";
  RCTParseObjCMethodName(&methodName, &argTypes);
  XCTAssertEqualObjects(methodName, @"foo:bar:");
  XCTAssertEqual(argTypes.count, (NSUInteger)2);
  XCTAssertEqualObjects(argTypes[0], @"NSInteger");
  XCTAssertEqualObjects(argTypes[1], @"BOOL");
}

- (void)testNewlines
{
  NSArray *argTypes;
  NSString *methodName = @"foo : (NSInteger)foo\nbar : (BOOL) bar";
  RCTParseObjCMethodName(&methodName, &argTypes);
  XCTAssertEqualObjects(methodName, @"foo:bar:");
  XCTAssertEqual(argTypes.count, (NSUInteger)2);
  XCTAssertEqualObjects(argTypes[0], @"NSInteger");
  XCTAssertEqualObjects(argTypes[1], @"BOOL");
}

- (void)testUnnamedArgs
{
  NSArray *argTypes;
  NSString *methodName = @"foo:(NSInteger)foo:(BOOL)bar";
  RCTParseObjCMethodName(&methodName, &argTypes);
  XCTAssertEqualObjects(methodName, @"foo::");
  XCTAssertEqual(argTypes.count, (NSUInteger)2);
  XCTAssertEqualObjects(argTypes[0], @"NSInteger");
  XCTAssertEqualObjects(argTypes[1], @"BOOL");
}

- (void)testUntypedUnnamedArgs
{
  NSArray *argTypes;
  NSString *methodName = @"foo:foo:bar:bar";
  RCTParseObjCMethodName(&methodName, &argTypes);
  XCTAssertEqualObjects(methodName, @"foo:::");
  XCTAssertEqual(argTypes.count, (NSUInteger)3);
  XCTAssertEqualObjects(argTypes[0], @"id");
  XCTAssertEqualObjects(argTypes[1], @"id");
  XCTAssertEqualObjects(argTypes[2], @"id");
}

- (void)testAttributes
{
  NSArray *argTypes;
  NSString *methodName = @"foo:(__attribute__((nonnull)) NSString *)foo bar:(__unused BOOL)bar";
  RCTParseObjCMethodName(&methodName, &argTypes);
  XCTAssertEqualObjects(methodName, @"foo:bar:");
  XCTAssertEqual(argTypes.count, (NSUInteger)2);
  XCTAssertEqualObjects(argTypes[0], @"NSString");
  XCTAssertEqualObjects(argTypes[1], @"BOOL");
}

- (void)testSemicolonStripping
{
  NSArray *argTypes;
  NSString *methodName = @"foo:(NSString *)foo bar:(BOOL)bar;";
  RCTParseObjCMethodName(&methodName, &argTypes);
  XCTAssertEqualObjects(methodName, @"foo:bar:");
  XCTAssertEqual(argTypes.count, (NSUInteger)2);
  XCTAssertEqualObjects(argTypes[0], @"NSString");
  XCTAssertEqualObjects(argTypes[1], @"BOOL");
}

@end
