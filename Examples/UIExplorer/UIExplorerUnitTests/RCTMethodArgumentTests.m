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

#import <UIKit/UIKit.h>
#import <XCTest/XCTest.h>

#import "RCTModuleMethod.h"

@interface RCTMethodArgumentTests : XCTestCase

@end

@implementation RCTMethodArgumentTests

extern void RCTParseObjCMethodName(NSString **objCMethodName, NSArray **argTypes);

- (void)testOneArgument
{
  NSArray *arguments;
  NSString *methodName = @"foo:(NSInteger)foo";
  RCTParseObjCMethodName(&methodName, &arguments);
  XCTAssertEqualObjects(methodName, @"foo:");
  XCTAssertEqual(arguments.count, (NSUInteger)1);
  XCTAssertEqualObjects(((RCTMethodArgument *)arguments[0]).type, @"NSInteger");
}

- (void)testTwoArguments
{
  NSArray *arguments;
  NSString *methodName = @"foo:(NSInteger)foo bar:(BOOL)bar";
  RCTParseObjCMethodName(&methodName, &arguments);
  XCTAssertEqualObjects(methodName, @"foo:bar:");
  XCTAssertEqual(arguments.count, (NSUInteger)2);
  XCTAssertEqualObjects(((RCTMethodArgument *)arguments[0]).type, @"NSInteger");
  XCTAssertEqualObjects(((RCTMethodArgument *)arguments[1]).type, @"BOOL");
}

- (void)testSpaces
{
  NSArray *arguments;
  NSString *methodName = @"foo : (NSInteger)foo bar : (BOOL) bar";
  RCTParseObjCMethodName(&methodName, &arguments);
  XCTAssertEqualObjects(methodName, @"foo:bar:");
  XCTAssertEqual(arguments.count, (NSUInteger)2);
  XCTAssertEqualObjects(((RCTMethodArgument *)arguments[0]).type, @"NSInteger");
  XCTAssertEqualObjects(((RCTMethodArgument *)arguments[1]).type, @"BOOL");
}

- (void)testNewlines
{
  NSArray *arguments;
  NSString *methodName = @"foo : (NSInteger)foo\nbar : (BOOL) bar";
  RCTParseObjCMethodName(&methodName, &arguments);
  XCTAssertEqualObjects(methodName, @"foo:bar:");
  XCTAssertEqual(arguments.count, (NSUInteger)2);
  XCTAssertEqualObjects(((RCTMethodArgument *)arguments[0]).type, @"NSInteger");
  XCTAssertEqualObjects(((RCTMethodArgument *)arguments[1]).type, @"BOOL");
}

- (void)testUnnamedArgs
{
  NSArray *arguments;
  NSString *methodName = @"foo:(NSInteger)foo:(BOOL)bar";
  RCTParseObjCMethodName(&methodName, &arguments);
  XCTAssertEqualObjects(methodName, @"foo::");
  XCTAssertEqual(arguments.count, (NSUInteger)2);
  XCTAssertEqualObjects(((RCTMethodArgument *)arguments[0]).type, @"NSInteger");
  XCTAssertEqualObjects(((RCTMethodArgument *)arguments[1]).type, @"BOOL");
}

- (void)testUntypedUnnamedArgs
{
  NSArray *arguments;
  NSString *methodName = @"foo:foo:bar:bar";
  RCTParseObjCMethodName(&methodName, &arguments);
  XCTAssertEqualObjects(methodName, @"foo:::");
  XCTAssertEqual(arguments.count, (NSUInteger)3);
  XCTAssertEqualObjects(((RCTMethodArgument *)arguments[0]).type, @"id");
  XCTAssertEqualObjects(((RCTMethodArgument *)arguments[1]).type, @"id");
  XCTAssertEqualObjects(((RCTMethodArgument *)arguments[2]).type, @"id");
}

- (void)testAttributes
{
  NSArray *arguments;
  NSString *methodName = @"foo:(__attribute__((nonnull)) NSString *)foo bar:(__unused BOOL)bar";
  RCTParseObjCMethodName(&methodName, &arguments);
  XCTAssertEqualObjects(methodName, @"foo:bar:");
  XCTAssertEqual(arguments.count, (NSUInteger)2);
  XCTAssertEqualObjects(((RCTMethodArgument *)arguments[0]).type, @"NSString");
  XCTAssertEqualObjects(((RCTMethodArgument *)arguments[1]).type, @"BOOL");
}

- (void)testNullability
{
  NSArray *arguments;
  NSString *methodName = @"foo:(nullable NSString *)foo bar:(nonnull NSNumber *)bar baz:(id)baz";
  RCTParseObjCMethodName(&methodName, &arguments);
  XCTAssertEqualObjects(methodName, @"foo:bar:baz:");
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
  NSString *methodName = @"foo:(NSString *)foo bar:(BOOL)bar;";
  RCTParseObjCMethodName(&methodName, &arguments);
  XCTAssertEqualObjects(methodName, @"foo:bar:");
  XCTAssertEqual(arguments.count, (NSUInteger)2);
  XCTAssertEqualObjects(((RCTMethodArgument *)arguments[0]).type, @"NSString");
  XCTAssertEqualObjects(((RCTMethodArgument *)arguments[1]).type, @"BOOL");
}

- (void)testUnused
{
  NSArray *arguments;
  NSString *methodName = @"foo:(__unused NSString *)foo bar:(NSNumber *)bar";
  RCTParseObjCMethodName(&methodName, &arguments);
  XCTAssertEqualObjects(methodName, @"foo:bar:");
  XCTAssertEqual(arguments.count, (NSUInteger)2);
  XCTAssertEqualObjects(((RCTMethodArgument *)arguments[0]).type, @"NSString");
  XCTAssertEqualObjects(((RCTMethodArgument *)arguments[1]).type, @"NSNumber");
  XCTAssertTrue(((RCTMethodArgument *)arguments[0]).unused);
  XCTAssertFalse(((RCTMethodArgument *)arguments[1]).unused);
}

@end
