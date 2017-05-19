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

#import <React/RCTBridgeModule.h>
#import <React/RCTLog.h>
#import <React/RCTModuleMethod.h>

static BOOL RCTLogsError(void (^block)(void))
{
  __block BOOL loggedError = NO;
  RCTPerformBlockWithLogFunction(block, ^(RCTLogLevel level,
                                          __unused RCTLogSource source,
                                          __unused NSString *fileName,
                                          __unused NSNumber *lineNumber,
                                          __unused NSString *message) {
    loggedError = (level == RCTLogLevelError);
  });
  return loggedError;
}

@interface RCTModuleMethodTests : XCTestCase <RCTBridgeModule>

@end

@implementation RCTModuleMethodTests
{
  CGRect _s;
}

static RCTModuleMethod *buildDefaultMethodWithMethodSignature(NSString *methodSignature) {
  return [[RCTModuleMethod alloc] initWithMethodSignature:methodSignature
                                             JSMethodName:nil
                                                   isSync:NO
                                              moduleClass:[RCTModuleMethodTests class]];
}

static RCTModuleMethod *buildSyncMethodWithMethodSignature(NSString *methodSignature) {
  return [[RCTModuleMethod alloc] initWithMethodSignature:methodSignature
                                             JSMethodName:nil
                                                   isSync:YES
                                              moduleClass:[RCTModuleMethodTests class]];
}

+ (NSString *)moduleName { return nil; }

- (void)doFoo { }

- (void)doFooWithBar:(__unused NSString *)bar { }

- (id)echoString:(NSString *)input { return input; }
- (id)methodThatReturnsNil { return nil; }

- (void)testNonnull
{
  NSString *methodSignature = @"doFooWithBar:(nonnull NSString *)bar";
  RCTModuleMethod *method = buildDefaultMethodWithMethodSignature(methodSignature);
  XCTAssertFalse(RCTLogsError(^{
    [method invokeWithBridge:nil module:self arguments:@[@"Hello World"]];
  }));

  XCTAssertTrue(RCTLogsError(^{
    [method invokeWithBridge:nil module:self arguments:@[[NSNull null]]];
  }));
}

- (void)doFooWithNumber:(__unused NSNumber *)n { }
- (void)doFooWithDouble:(__unused double)n { }
- (void)doFooWithInteger:(__unused NSInteger)n { }
- (void)doFooWithCGRect:(CGRect)s { _s = s; }

- (void)doFoo : (__unused NSString *)foo { }

- (void)testNumbersNonnull
{
  {
    // Specifying an NSNumber param without nonnull isn't allowed
    XCTAssertTrue(RCTLogsError(^{
      NSString *methodSignature = @"doFooWithNumber:(NSNumber *)n";
      RCTModuleMethod *method = buildDefaultMethodWithMethodSignature(methodSignature);
      // Invoke method to trigger parsing
      [method invokeWithBridge:nil module:self arguments:@[@1]];
    }));
  }

  {
    NSString *methodSignature = @"doFooWithNumber:(nonnull NSNumber *)n";
    RCTModuleMethod *method = buildDefaultMethodWithMethodSignature(methodSignature);
    XCTAssertTrue(RCTLogsError(^{
      [method invokeWithBridge:nil module:self arguments:@[[NSNull null]]];
    }));
  }

  {
    NSString *methodSignature = @"doFooWithDouble:(double)n";
    RCTModuleMethod *method = buildDefaultMethodWithMethodSignature(methodSignature);
    XCTAssertTrue(RCTLogsError(^{
      [method invokeWithBridge:nil module:self arguments:@[[NSNull null]]];
    }));
  }

  {
    NSString *methodSignature = @"doFooWithInteger:(NSInteger)n";
    RCTModuleMethod *method = buildDefaultMethodWithMethodSignature(methodSignature);
    XCTAssertTrue(RCTLogsError(^{
      [method invokeWithBridge:nil module:self arguments:@[[NSNull null]]];
    }));
  }
}

- (void)testStructArgument
{
  NSString *methodSignature = @"doFooWithCGRect:(CGRect)s";
  RCTModuleMethod *method = buildDefaultMethodWithMethodSignature(methodSignature);

  CGRect r = CGRectMake(10, 20, 30, 40);
  [method invokeWithBridge:nil module:self arguments:@[@[@10, @20, @30, @40]]];
  XCTAssertTrue(CGRectEqualToRect(r, _s));
}

- (void)testWhitespaceTolerance
{
  NSString *methodSignature = @"doFoo : \t (NSString *)foo";

  __block RCTModuleMethod *method;
  XCTAssertFalse(RCTLogsError(^{
    method = buildDefaultMethodWithMethodSignature(methodSignature);
  }));

  XCTAssertEqualObjects(method.JSMethodName, @"doFoo");

  XCTAssertFalse(RCTLogsError(^{
    [method invokeWithBridge:nil module:self arguments:@[@"bar"]];
  }));
}

- (void)testFunctionType
{
  {
    NSString *methodSignature = @"doFoo";
    RCTModuleMethod *method = buildDefaultMethodWithMethodSignature(methodSignature);
    XCTAssertTrue(method.functionType == RCTFunctionTypeNormal);
  }

  {
    NSString *methodSignature = @"openURL:(NSURL *)URL resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject";
    RCTModuleMethod *method = buildDefaultMethodWithMethodSignature(methodSignature);
    XCTAssertTrue(method.functionType == RCTFunctionTypePromise);
  }

  {
    NSString *methodSignature = @"echoString:(NSString *)input";
    RCTModuleMethod *method = buildSyncMethodWithMethodSignature(methodSignature);
    XCTAssertTrue(method.functionType == RCTFunctionTypeSync);
  }
}

- (void)testReturnsValueForSyncFunction
{
  {
    NSString *methodSignature = @"echoString:(NSString *)input";
    RCTModuleMethod *method = buildSyncMethodWithMethodSignature(methodSignature);
    id result = [method invokeWithBridge:nil module:self arguments:@[@"Test String Value"]];
    XCTAssertEqualObjects(result, @"Test String Value");
  }

  {
    NSString *methodSignature = @"methodThatReturnsNil";
    RCTModuleMethod *method = buildSyncMethodWithMethodSignature(methodSignature);
    id result = [method invokeWithBridge:nil module:self arguments:@[]];
    XCTAssertNil(result);
  }
}

- (void)testReturnsNilForDefaultFunction
{
  NSString *methodSignature = @"doFoo";
  RCTModuleMethod *method = buildDefaultMethodWithMethodSignature(methodSignature);
  id result = [method invokeWithBridge:nil module:self arguments:@[]];
  XCTAssertNil(result);
}

- (void)testReturnTypeForSyncFunction
{
  {
    NSString *methodSignature = @"methodThatReturnsNil";
    RCTModuleMethod *method = buildSyncMethodWithMethodSignature(methodSignature);
    XCTAssertFalse(RCTLogsError(^{
      // Invoke method to trigger parsing
      __unused SEL selector = method.selector;
    }), @"Unexpected error when parsing sync function with (id) return type");
  }

  {
    NSString *methodSignature = @"doFoo";
    RCTModuleMethod *method = buildSyncMethodWithMethodSignature(methodSignature);
    XCTAssertTrue(RCTLogsError(^{
      // Invoke method to trigger parsing
      __unused SEL selector = method.selector;
    }), @"Failed to trigger an error when parsing sync function with non-(id) return type");
  }
}

@end
