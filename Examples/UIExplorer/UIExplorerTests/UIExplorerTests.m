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

#define TIMEOUT_SECONDS 240

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
  RCTAssert([version isEqualToString:@"8.1"], @"Snapshot tests should be run on iOS 8.1, found %@", version);
  _runner = RCTInitRunnerForApp(@"Examples/UIExplorer/UIExplorerApp");

  // If tests have changes, set recordMode = YES below and run the affected
  // tests on an iPhone5, iOS 8.1 simulator.
  _runner.recordMode = NO;
}

- (BOOL)findSubviewInView:(UIView *)view matching:(BOOL(^)(UIView *view))test
{
  if (test(view)) {
    return YES;
  }
  for (UIView *subview in [view subviews]) {
    if ([self findSubviewInView:subview matching:test]) {
      return YES;
    }
  }
  return NO;
}

// Make sure this test runs first (underscores sort early) otherwise the
// other tests will tear out the rootView
- (void)test__RootViewLoadsAndRenders
{
  UIViewController *vc = [[[[UIApplication sharedApplication] delegate] window] rootViewController];
  RCTAssert([vc.view isKindOfClass:[RCTRootView class]], @"This test must run first.");
  NSDate *date = [NSDate dateWithTimeIntervalSinceNow:TIMEOUT_SECONDS];
  BOOL foundElement = NO;
  NSString *redboxError = nil;

  while ([date timeIntervalSinceNow] > 0 && !foundElement && !redboxError) {
    [[NSRunLoop mainRunLoop] runMode:NSDefaultRunLoopMode beforeDate:date];
    [[NSRunLoop mainRunLoop] runMode:NSRunLoopCommonModes beforeDate:date];

    redboxError = [[RCTRedBox sharedInstance] currentErrorMessage];

    foundElement = [self findSubviewInView:vc.view matching:^BOOL(UIView *view) {
      if ([view respondsToSelector:@selector(attributedText)]) {
        NSString *text = [(id)view attributedText].string;
        if ([text isEqualToString:@"<View>"]) {
          return YES;
        }
      }
      return NO;
    }];
  }

  XCTAssertNil(redboxError, @"RedBox error: %@", redboxError);
  XCTAssertTrue(foundElement, @"Cound't find element with '<View>' text in %d seconds", TIMEOUT_SECONDS);
}

- (void)testViewExampleSnapshot
{
  [_runner runTest:_cmd module:@"ViewExample"];
}

- (void)testLayoutExampleSnapshot
{
  [_runner runTest:_cmd module:@"LayoutExample"];
}

- (void)testTextExampleSnapshot
{
  [_runner runTest:_cmd module:@"TextExample"];
}

- (void)testSwitchExampleSnapshot
{
  [_runner runTest:_cmd module:@"SwitchExample"];
}

- (void)testSliderExampleSnapshot
{
  [_runner runTest:_cmd module:@"SliderExample"];
}

- (void)testTabBarExampleSnapshot
{
  [_runner runTest:_cmd module:@"TabBarExample"];
}

- (void)testZZZ_NotInRecordMode
{
  RCTAssert(_runner.recordMode == NO, @"Don't forget to turn record mode back to NO before commit.");
}

@end
