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

@import XCTest;
@import ObjectiveC;

#import "RCTNetworking.h"

@interface RCTNetworking ()

+ (NSString *)decodeTextData:(NSData *)data fromResponse:(NSURLResponse *)response withCarryData:(NSMutableData*)inputCarryData;

@end

@interface RCTUnicodeDecodeTests : XCTestCase @end

@implementation RCTUnicodeDecodeTests

- (void)testUnicodeDecode
{
  NSString* unicodeString = @"😀😀";
  NSData* unicodeBytes = [unicodeString dataUsingEncoding:NSUTF8StringEncoding];
  
  NSURLResponse* fakeResponse = [[NSHTTPURLResponse alloc] initWithURL:[NSURL URLWithString:@"testurl://"]
                                                            statusCode:200
                                                           HTTPVersion:@"1.1"
                                                          headerFields:@{@"content-type": @"text/plain; charset=utf-8"}];
  XCTAssert([fakeResponse.textEncodingName isEqualToString:@"utf-8"]);
  
  NSMutableData* carryStorage = [NSMutableData new];
  NSMutableString* parsedString = [NSMutableString new];
  
  [parsedString appendString:[RCTNetworking decodeTextData:[unicodeBytes subdataWithRange:NSMakeRange(0, 7)]
                                              fromResponse:fakeResponse
                                             withCarryData:carryStorage]];
  
  XCTAssert(carryStorage.length == 3);
  
  [parsedString appendString:[RCTNetworking decodeTextData:[unicodeBytes subdataWithRange:NSMakeRange(7, unicodeBytes.length - 7)]
                                              fromResponse:fakeResponse
                                             withCarryData:carryStorage]];
  
  XCTAssert(carryStorage.length == 0);
  
  XCTAssert([parsedString isEqualToString:unicodeString]);
}

@end
