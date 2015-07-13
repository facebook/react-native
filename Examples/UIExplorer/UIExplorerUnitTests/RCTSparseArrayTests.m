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

#import "RCTSparseArray.h"
#import "UIView+React.h"

@interface RCTSparseArrayTests : XCTestCase

@end

@implementation RCTSparseArrayTests

- (void)testDictionary
{
  NSObject<RCTViewNodeProtocol> *myView = [[UIView alloc] init];
  myView.reactTag = @4;

  NSObject<RCTViewNodeProtocol> *myOtherView = [[UIView alloc] init];
  myOtherView.reactTag = @5;

  RCTSparseArray *registry = [[RCTSparseArray alloc] init];
  XCTAssertNil(registry[@4], @"how did you have a view when none are registered?");
  XCTAssertNil(registry[@5], @"how did you have a view when none are registered?");

  registry[myView.reactTag] = myView;
  XCTAssertEqual(registry[@4], myView);
  XCTAssertNil(registry[@5], @"didn't register other view yet");

  registry[myOtherView.reactTag] = myOtherView;
  XCTAssertEqual(registry[@4], myView);
  XCTAssertEqual(registry[@5], myOtherView);

  registry[myView.reactTag] = nil;
  XCTAssertNil(registry[@4]);
  XCTAssertEqual(registry[@5], myOtherView);

  registry[myOtherView.reactTag] = nil;
  XCTAssertNil(registry[@4], @"how did you have a view when none are registered?");
  XCTAssertNil(registry[@5], @"how did you have a view when none are registered?");
}

@end
