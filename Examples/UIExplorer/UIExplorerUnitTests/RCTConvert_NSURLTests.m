// Copyright 2004-present Facebook. All Rights Reserved.

#import <XCTest/XCTest.h>

#import "RCTConvert.h"

@interface RCTConvert_NSURLTests : XCTestCase

@end

@implementation RCTConvert_NSURLTests

#define TEST_URL(name, _input, _expectedURL) \
- (void)test_##name { \
  NSURL *result = [RCTConvert NSURL:_input]; \
  NSURL *expected = (_expectedURL) ? [NSURL URLWithString:_expectedURL ?: @""] : nil; \
  XCTAssertEqualObjects(result.absoluteURL, expected); \
} \

#define TEST_PATH(name, _input, _expectedPath) \
- (void)test_##name { \
  NSURL *result = [RCTConvert NSURL:_input]; \
  XCTAssertEqualObjects(result.path, _expectedPath); \
} \

#define TEST_BUNDLE_PATH(name, _input, _expectedPath) \
TEST_PATH(name, _input, [[[NSBundle mainBundle] bundlePath] stringByAppendingPathComponent:_expectedPath])

// Basic tests
TEST_URL(basic, @"http://example.com", @"http://example.com")
TEST_URL(null, (id)kCFNull, nil)

// Local files
TEST_PATH(fileURL, @"file:///blah/hello.jsbundle", @"/blah/hello.jsbundle")
TEST_BUNDLE_PATH(filePath, @"blah/hello.jsbundle", @"blah/hello.jsbundle")
TEST_BUNDLE_PATH(filePathWithSpaces, @"blah blah/hello.jsbundle", @"blah blah/hello.jsbundle")
TEST_BUNDLE_PATH(filePathWithEncodedSpaces, @"blah%20blah/hello.jsbundle", @"blah blah/hello.jsbundle")
TEST_BUNDLE_PATH(imageAt2XPath, @"images/foo@2x.jpg",  @"images/foo@2x.jpg")
TEST_BUNDLE_PATH(imageFile, @"foo.jpg",  @"foo.jpg")

// Remote files
TEST_URL(fullURL, @"http://example.com/blah/hello.jsbundle", @"http://example.com/blah/hello.jsbundle")
TEST_URL(urlWithSpaces, @"http://example.com/blah blah/foo", @"http://example.com/blah%20blah/foo")
TEST_URL(urlWithEncodedSpaces, @"http://example.com/blah%20blah/foo", @"http://example.com/blah%20blah/foo")
TEST_URL(imageURL, @"http://example.com/foo@2x.jpg",  @"http://example.com/foo@2x.jpg")
TEST_URL(imageURLWithSpaces, @"http://example.com/blah foo@2x.jpg",  @"http://example.com/blah%20foo@2x.jpg")

@end
