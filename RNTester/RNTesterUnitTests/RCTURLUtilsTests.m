/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <XCTest/XCTest.h>

#import <React/RCTUtils.h>

@interface RCTURLUtilsTests : XCTestCase

@end

@implementation RCTURLUtilsTests

- (void)testGetQueryParam
{
  NSURL *URL = [NSURL URLWithString:@"http://example.com?foo=bar&bar=foo"];
  NSString *foo = RCTGetURLQueryParam(URL, @"foo");
  NSString *bar = RCTGetURLQueryParam(URL, @"bar");
  XCTAssertEqualObjects(foo, @"bar");
  XCTAssertEqualObjects(bar, @"foo");
}

- (void)testGetEncodedParam
{
  NSURL *URL = [NSURL URLWithString:@"http://example.com?foo=You%20%26%20Me"];
  NSString *foo = RCTGetURLQueryParam(URL, @"foo");
  XCTAssertEqualObjects(foo, @"You & Me");
}

- (void)testQueryParamNotFound
{
  NSURL *URL = [NSURL URLWithString:@"http://example.com?foo=bar"];
  NSString *bar = RCTGetURLQueryParam(URL, @"bar");
  XCTAssertNil(bar);
}

- (void)testDuplicateParamTakesLatter
{
  NSURL *URL = [NSURL URLWithString:@"http://example.com?foo=bar&foo=foo"];
  NSString *foo = RCTGetURLQueryParam(URL, @"foo");
  XCTAssertEqualObjects(foo, @"foo");
}

- (void)testNilURLGetQueryParam
{
  NSURL *URL = nil;
  NSString *foo = RCTGetURLQueryParam(URL, @"foo");
  XCTAssertNil(foo);
}

- (void)testReplaceParam
{
  NSURL *URL = [NSURL URLWithString:@"http://example.com?foo=bar&bar=foo"];
  NSURL *result = RCTURLByReplacingQueryParam(URL, @"foo", @"foo");
  XCTAssertEqualObjects(result.absoluteString, @"http://example.com?foo=foo&bar=foo");
}

- (void)testReplaceEncodedParam
{
  NSURL *URL = [NSURL URLWithString:@"http://example.com?foo=You%20%26%20Me"];
  NSURL *result = RCTURLByReplacingQueryParam(URL, @"foo", @"Me & You");
  XCTAssertEqualObjects(result.absoluteString, @"http://example.com?foo=Me%20%26%20You");
}

- (void)testAppendParam
{
  NSURL *URL = [NSURL URLWithString:@"http://example.com?bar=foo"];
  NSURL *result = RCTURLByReplacingQueryParam(URL, @"foo", @"bar");
  XCTAssertEqualObjects(result.absoluteString, @"http://example.com?bar=foo&foo=bar");
}

- (void)testRemoveParam
{
  NSURL *URL = [NSURL URLWithString:@"http://example.com?bar=foo&foo=bar"];
  NSURL *result = RCTURLByReplacingQueryParam(URL, @"bar", nil);
  XCTAssertEqualObjects(result.absoluteString, @"http://example.com?foo=bar");
}

- (void)testNilURLAppendQueryParam
{
  NSURL *URL = nil;
  NSURL *result = RCTURLByReplacingQueryParam(URL, @"foo", @"bar");
  XCTAssertNil(result);
}

- (void)testIsLocalAssetsURLParam
{
  NSString *libraryAssetsPath = [RCTLibraryPath() stringByAppendingPathComponent:@"assets/foo.png"];
  NSURL *libraryAssetsURL = [NSURL fileURLWithPath:libraryAssetsPath];
  XCTAssertTrue(RCTIsLocalAssetURL(libraryAssetsURL));
  NSString *bundleAssetsPath = [[[NSBundle mainBundle] resourcePath] stringByAppendingPathComponent:@"assets/foo.png"];
  NSURL *bundleAssetsURL = [NSURL fileURLWithPath:bundleAssetsPath];
  XCTAssertTrue(RCTIsLocalAssetURL(bundleAssetsURL));
  NSString *otherAssetsPath = @"/assets/foo.png";
  NSURL *otherAssetsURL = [NSURL fileURLWithPath:otherAssetsPath];
  XCTAssertFalse(RCTIsLocalAssetURL(otherAssetsURL));
}

@end
