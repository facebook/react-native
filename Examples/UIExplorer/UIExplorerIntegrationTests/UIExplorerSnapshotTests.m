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

@interface UIExplorerSnapshotTests : XCTestCase
{
  RCTTestRunner *_runner;
}

@end

@implementation UIExplorerSnapshotTests

- (void)setUp
{
#if __LP64__
  RCTAssert(NO, @"Tests should be run on 32-bit device simulators (e.g. iPhone 5)");
#endif

  NSOperatingSystemVersion version = [NSProcessInfo processInfo].operatingSystemVersion;
  RCTAssert((version.majorVersion == 8 && version.minorVersion >= 3) || version.majorVersion >= 9, @"Tests should be run on iOS 8.3+, found %zd.%zd.%zd", version.majorVersion, version.minorVersion, version.patchVersion);
  _runner = RCTInitRunnerForApp(@"Examples/UIExplorer/UIExplorerApp.ios", nil);
  _runner.recordMode = NO;
}

#define RCT_TEST(name)                  \
- (void)test##name                      \
{                                       \
  [_runner runTest:_cmd module:@#name]; \
}

RCT_TEST(ViewExample)
RCT_TEST(LayoutExample)
RCT_TEST(TextExample)
RCT_TEST(SwitchExample)
//RCT_TEST(SliderExample) // Disabled: #8985988
//RCT_TEST(TabBarExample) // Disabled: #8985988

- (void)testZZZNotInRecordMode
{
  XCTAssertFalse(_runner.recordMode, @"Don't forget to turn record mode back to off");
}

@end
