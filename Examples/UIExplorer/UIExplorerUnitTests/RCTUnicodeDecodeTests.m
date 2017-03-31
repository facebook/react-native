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

#import <React/RCTNetworking.h>

static NSString *const niqqudStringB64 = @"15HWsNa816jWtdeQ16nWtNeB15nXqiwg15HWuNa816jWuNeQINeQ1rHXnNa515TWtNeZ150sINeQ1rXXqiDXlNa316nWuNa814HXnta315nWtNedLCDXldaw15DWtdeqINeU1rjXkNa416jWttelLg==";

@interface RCTNetworking ()

+ (NSString *)decodeTextData:(NSData *)data fromResponse:(NSURLResponse *)response withCarryData:(NSMutableData *)inputCarryData;

@end

@interface RCTUnicodeDecodeTests : XCTestCase

@end

@implementation RCTUnicodeDecodeTests

- (void)runTestForString:(NSString *)unicodeString usingEncoding:(NSString *)encodingName cutAt:(NSUInteger)cutPoint
{
  CFStringEncoding cfEncoding = CFStringConvertIANACharSetNameToEncoding((CFStringRef)encodingName);
  NSStringEncoding encoding = CFStringConvertEncodingToNSStringEncoding(cfEncoding);

  NSData *unicodeBytes = [unicodeString dataUsingEncoding:encoding];

  NSURLResponse *fakeResponse = [[NSHTTPURLResponse alloc] initWithURL:[NSURL URLWithString:@"testurl://"]
                                                            statusCode:200
                                                           HTTPVersion:@"1.1"
                                                          headerFields:@{@"content-type": [NSString stringWithFormat:@"text/plain; charset=%@", encodingName]}];
  XCTAssert([fakeResponse.textEncodingName isEqualToString:encodingName]);

  NSMutableData *carryStorage = [NSMutableData new];
  NSMutableString *parsedString = [NSMutableString new];

  [parsedString appendString:[RCTNetworking decodeTextData:[unicodeBytes subdataWithRange:NSMakeRange(0, cutPoint)]
                                              fromResponse:fakeResponse
                                             withCarryData:carryStorage] ?: @""];

  [parsedString appendString:[RCTNetworking decodeTextData:[unicodeBytes subdataWithRange:NSMakeRange(cutPoint, unicodeBytes.length - cutPoint)]
                                              fromResponse:fakeResponse
                                             withCarryData:carryStorage] ?: @""];

  XCTAssert(carryStorage.length == 0);
  XCTAssert([parsedString isEqualToString:unicodeString]);
}

- (void)testNiqqud
{
  NSString *unicodeString = [[NSString alloc] initWithData:[[NSData alloc] initWithBase64EncodedString:niqqudStringB64
                                                                                               options:(NSDataBase64DecodingOptions)0]
                                                  encoding:NSUTF8StringEncoding];

  [self runTestForString:unicodeString usingEncoding:@"utf-8" cutAt:25];
}

- (void)testEmojis
{
  NSString *unicodeString = @"\U0001F602\U0001F602";

  [self runTestForString:unicodeString usingEncoding:@"utf-8" cutAt:7];
}

@end
