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

#import <RCTTest/RCTTestRunner.h>

#import "RCTAssert.h"
#import "RCTRedBox.h"
#import "RCTRootView.h"

@interface UIExplorerTests : XCTestCase
{
  RCTTestRunner *_runner;
}

@end

@implementation UIExplorerTests

- (void)setUp
{
#ifdef __LP64__
  RCTAssert(!__LP64__, @"Snapshot tests should be run on 32-bit device simulators (e.g. iPhone 5)");
#endif
  NSString *version = [[UIDevice currentDevice] systemVersion];
  RCTAssert([version isEqualToString:@"8.3"], @"Snapshot tests should be run on iOS 8.3, found %@", version);
  _runner = RCTInitRunnerForApp(@"Examples/UIExplorer/UIExplorerApp.ios");
}

#define RCT_SNAPSHOT_TEST(name, reRecord) \
- (void)test##name##Snapshot              \
{                                         \
  _runner.recordMode |= reRecord;         \
  [_runner runTest:_cmd module:@#name];   \
}

RCT_SNAPSHOT_TEST(ViewExample, NO)
RCT_SNAPSHOT_TEST(LayoutExample, NO)
RCT_SNAPSHOT_TEST(TextExample, NO)
RCT_SNAPSHOT_TEST(SwitchExample, NO)
RCT_SNAPSHOT_TEST(SliderExample, NO)
RCT_SNAPSHOT_TEST(TabBarExample, NO)

@end
