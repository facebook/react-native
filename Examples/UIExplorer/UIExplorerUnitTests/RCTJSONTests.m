/**
 * The examples provided by Facebook are for non-commercial testing and
 * evaluation purposes only.
 *
 * Facebook reserves all rights not expressly granted.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
 * OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NON INFRINGEMENT. IN NO EVENT SHALL
 * FACEBOOK BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN
 * AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

#import <XCTest/XCTest.h>
#import "RCTUtils.h"

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
