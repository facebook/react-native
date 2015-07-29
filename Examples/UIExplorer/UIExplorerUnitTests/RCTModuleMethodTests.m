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
#import "RCTLog.h"

@interface RCTModuleMethodTests : XCTestCase

@end

@implementation RCTModuleMethodTests

- (void)doFooWithBar:(__unused NSString *)bar { }

- (void)testNonnull
{
  NSString *methodName = @"doFooWithBar:(nonnull NSString *)bar";
  RCTModuleMethod *method = [[RCTModuleMethod alloc] initWithObjCMethodName:methodName
                                                               JSMethodName:nil
                                                                moduleClass:[self class]];

  {
    __block BOOL loggedError = NO;
    RCTPerformBlockWithLogFunction(^{
      [method invokeWithBridge:nil module:self arguments:@[@"Hello World"]];
    }, ^(RCTLogLevel level,
         __unused NSString *fileName,
         __unused NSNumber *lineNumber,
         __unused NSString *message) {
      loggedError = (level == RCTLogLevelError);
    });
    XCTAssertFalse(loggedError);
  }

  {
    __block BOOL loggedError = NO;
    RCTPerformBlockWithLogFunction(^{
      [method invokeWithBridge:nil module:self arguments:@[[NSNull null]]];
    }, ^(RCTLogLevel level,
         __unused NSString *fileName,
         __unused NSNumber *lineNumber,
         __unused NSString *message) {
      loggedError = (level == RCTLogLevelError);
    });
    XCTAssertTrue(loggedError);
  }
}

@end
