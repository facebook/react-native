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

#import <React/RCTMultipartStreamReader.h>

@interface RCTMultipartStreamReaderTests : XCTestCase

@end

@implementation RCTMultipartStreamReaderTests

- (void)testSimpleCase {
  NSString *response =
  @"preable, should be ignored\r\n"
  @"--sample_boundary\r\n"
  @"Content-Type: application/json; charset=utf-8\r\n"
  @"Content-Length: 2\r\n\r\n"
  @"{}\r\n"
  @"--sample_boundary--\r\n"
  @"epilogue, should be ignored";

  NSInputStream *inputStream = [NSInputStream inputStreamWithData:[response dataUsingEncoding:NSUTF8StringEncoding]];
  RCTMultipartStreamReader *reader = [[RCTMultipartStreamReader alloc] initWithInputStream:inputStream boundary:@"sample_boundary"];
  __block NSInteger count = 0;
  BOOL success = [reader readAllParts:^(NSDictionary *headers, NSData *content, BOOL done) {
    XCTAssertTrue(done);
    XCTAssertEqualObjects(headers[@"Content-Type"], @"application/json; charset=utf-8");
    XCTAssertEqualObjects([[NSString alloc] initWithData:content encoding:NSUTF8StringEncoding], @"{}");
    count++;
  }];
  XCTAssertTrue(success);
  XCTAssertEqual(count, 1);
}

- (void)testMultipleParts {
  NSString *response =
  @"preable, should be ignored\r\n"
  @"--sample_boundary\r\n"
  @"1\r\n"
  @"--sample_boundary\r\n"
  @"2\r\n"
  @"--sample_boundary\r\n"
  @"3\r\n"
  @"--sample_boundary--\r\n"
  @"epilogue, should be ignored";

  NSInputStream *inputStream = [NSInputStream inputStreamWithData:[response dataUsingEncoding:NSUTF8StringEncoding]];
  RCTMultipartStreamReader *reader = [[RCTMultipartStreamReader alloc] initWithInputStream:inputStream boundary:@"sample_boundary"];
  __block NSInteger count = 0;
  BOOL success = [reader readAllParts:^(__unused NSDictionary *headers, NSData *content, BOOL done) {
    count++;
    XCTAssertEqual(done, count == 3);
    NSString *expectedBody = [NSString stringWithFormat:@"%ld", (long)count];
    NSString *actualBody = [[NSString alloc] initWithData:content encoding:NSUTF8StringEncoding];
    XCTAssertEqualObjects(actualBody, expectedBody);
  }];
  XCTAssertTrue(success);
  XCTAssertEqual(count, 3);
}

- (void)testNoDelimiter {
  NSString *response = @"Yolo";

  NSInputStream *inputStream = [NSInputStream inputStreamWithData:[response dataUsingEncoding:NSUTF8StringEncoding]];
  RCTMultipartStreamReader *reader = [[RCTMultipartStreamReader alloc] initWithInputStream:inputStream boundary:@"sample_boundary"];
  __block NSInteger count = 0;
  BOOL success = [reader readAllParts:^(__unused NSDictionary *headers, __unused NSData *content, __unused BOOL done) {
    count++;
  }];
  XCTAssertFalse(success);
  XCTAssertEqual(count, 0);
}

- (void)testNoCloseDelimiter {
  NSString *response =
  @"preable, should be ignored\r\n"
  @"--sample_boundary\r\n"
  @"Content-Type: application/json; charset=utf-8\r\n"
  @"Content-Length: 2\r\n\r\n"
  @"{}\r\n"
  @"--sample_boundary\r\n"
  @"incomplete message...";

  NSInputStream *inputStream = [NSInputStream inputStreamWithData:[response dataUsingEncoding:NSUTF8StringEncoding]];
  RCTMultipartStreamReader *reader = [[RCTMultipartStreamReader alloc] initWithInputStream:inputStream boundary:@"sample_boundary"];
  __block NSInteger count = 0;
  BOOL success = [reader readAllParts:^(__unused NSDictionary *headers, __unused NSData *content, __unused BOOL done) {
    count++;
  }];
  XCTAssertFalse(success);
  XCTAssertEqual(count, 1);
}

@end
