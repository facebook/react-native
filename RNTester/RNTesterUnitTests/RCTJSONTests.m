/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

#import <XCTest/XCTest.h>

#import <React/RCTUtils.h>

@interface RCTJSONTests : XCTestCase

@end

@implementation RCTJSONTests

- (void)testEncodingObject
{
  NSDictionary<NSString *, id> *obj = @{@"foo": @"bar"};
  NSString *json = @"{\"foo\":\"bar\"}";
  XCTAssertEqualObjects(json, RCTJSONStringify(obj, NULL));
}

- (void)testEncodingArray
{
  NSArray<id> *array = @[@"foo", @"bar"];
  NSString *json = @"[\"foo\",\"bar\"]";
  XCTAssertEqualObjects(json, RCTJSONStringify(array, NULL));
}

- (void)testEncodingString
{
  NSString *text = @"Hello\nWorld";
  NSString *json = @"\"Hello\\nWorld\"";
  XCTAssertEqualObjects(json, RCTJSONStringify(text, NULL));
}

- (void)testEncodingNSError
{
  NSError *underlyingError = [NSError errorWithDomain:@"underlyingDomain" code:421 userInfo:nil];
  NSError *err = [NSError errorWithDomain:@"domain" code:68 userInfo:@{@"NSUnderlyingError": underlyingError}];

  // An assertion on the full object would be too brittle since it contains an iOS stack trace
  // so we are relying on the behavior of RCTJSONParse, which is tested below.
  NSDictionary<NSString *, id> *jsonObject = RCTJSErrorFromNSError(err);
  NSString *jsonString = RCTJSONStringify(jsonObject, NULL);
  NSDictionary<NSString *, id> *json = RCTJSONParse(jsonString, NULL);
  XCTAssertEqualObjects(json[@"code"], @"EDOMAIN68");
  XCTAssertEqualObjects(json[@"message"], @"The operation couldn\u2019t be completed. (domain error 68.)");
  XCTAssertEqualObjects(json[@"domain"], @"domain");
  XCTAssertEqualObjects(json[@"userInfo"][@"NSUnderlyingError"][@"code"], @"421");
  XCTAssertEqualObjects(json[@"userInfo"][@"NSUnderlyingError"][@"message"], @"underlying error");
  XCTAssertEqualObjects(json[@"userInfo"][@"NSUnderlyingError"][@"domain"], @"underlyingDomain");
}


- (void)testDecodingObject
{
  NSDictionary<NSString *, id> *obj = @{@"foo": @"bar"};
  NSString *json = @"{\"foo\":\"bar\"}";
  XCTAssertEqualObjects(obj, RCTJSONParse(json, NULL));
}

- (void)testDecodingArray
{
  NSArray<id> *array = @[@"foo", @"bar"];
  NSString *json = @"[\"foo\",\"bar\"]";
  XCTAssertEqualObjects(array, RCTJSONParse(json, NULL));
}

- (void)testDecodingString
{
  NSString *text = @"Hello\nWorld";
  NSString *json = @"\"Hello\\nWorld\"";
  XCTAssertEqualObjects(text, RCTJSONParse(json, NULL));
}

- (void)testDecodingMutableArray
{
  NSString *json = @"[1,2,3]";
  NSMutableArray<id> *array = RCTJSONParseMutable(json, NULL);
  XCTAssertNoThrow([array addObject:@4]);
  XCTAssertEqualObjects(array, (@[@1, @2, @3, @4]));
}

- (void)testLeadingWhitespace
{
  NSDictionary<NSString *, id> *obj = @{@"foo": @"bar"};
  NSString *json = @" \r\n\t{\"foo\":\"bar\"}";
  XCTAssertEqualObjects(obj, RCTJSONParse(json, NULL));
}

- (void)testNotJSONSerializable
{
  NSDictionary<NSString *, id> *obj = @{@"foo": [NSDate date]};
  NSString *json = @"{\"foo\":null}";
  XCTAssertEqualObjects(json, RCTJSONStringify(obj, NULL));
}

- (void)testNaN
{
  NSDictionary<NSString *, id> *obj = @{@"foo": @(NAN)};
  NSString *json = @"{\"foo\":0}";
  XCTAssertEqualObjects(json, RCTJSONStringify(obj, NULL));
}

- (void)testNotUTF8Convertible
{
  //see https://gist.github.com/0xced/56035d2f57254cf518b5
  NSString *string = [[NSString alloc] initWithBytes:"\xd8\x00" length:2 encoding:NSUTF16StringEncoding];
  NSDictionary<NSString *, id> *obj = @{@"foo": string};
  NSString *json = @"{\"foo\":null}";
  XCTAssertEqualObjects(json, RCTJSONStringify(obj, NULL));
}

- (void)testErrorPointer
{
  NSDictionary<NSString *, id> *obj = @{@"foo": [NSDate date]};
  NSError *error;
  XCTAssertNil(RCTJSONStringify(obj, &error));
  XCTAssertNotNil(error);
}

@end
