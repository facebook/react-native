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
#import "RCTNetworking.h"

extern BOOL RCTIsGzippedData(NSData *data);

@interface RCTNetworking (Private)

- (void)buildRequest:(NSDictionary<NSString *, id> *)query
     completionBlock:(void (^)(NSURLRequest *request))block;

@end

@interface RCTGzipTests : XCTestCase

@end

@implementation RCTGzipTests

- (void)testGzip
{
  //set up data
  NSString *inputString = @"Hello World!";
  NSData *inputData = [inputString dataUsingEncoding:NSUTF8StringEncoding];

  //compress
  NSData *outputData = RCTGzipData(inputData, -1);
  XCTAssertTrue(RCTIsGzippedData(outputData));
}

- (void)testDontRezipZippedData
{
  //set up data
  NSString *inputString = @"Hello World!";
  NSData *inputData = [inputString dataUsingEncoding:NSUTF8StringEncoding];

  //compress
  NSData *compressedData = RCTGzipData(inputData, -1);
  inputString = [[NSString alloc] initWithData:compressedData encoding:NSUTF8StringEncoding];

  //compress again
  NSData *outputData = RCTGzipData(inputData, -1);
  NSString *outputString = [[NSString alloc] initWithData:outputData encoding:NSUTF8StringEncoding];
  XCTAssertEqualObjects(outputString, inputString);
}

- (void)testRequestBodyEncoding
{
  NSDictionary *query = @{
                          @"url": @"http://example.com",
                          @"method": @"POST",
                          @"data": @{@"string": @"Hello World"},
                          @"headers": @{@"Content-Encoding": @"gzip"},
                          };

  RCTNetworking *networker = [RCTNetworking new];
  __block NSURLRequest *request = nil;
  [networker buildRequest:query completionBlock:^(NSURLRequest *_request) {
    request = _request;
  }];

  XCTAssertNotNil(request);
  XCTAssertNotNil(request.HTTPBody);
  XCTAssertTrue(RCTIsGzippedData(request.HTTPBody));
}

@end
