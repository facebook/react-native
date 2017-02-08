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

@interface UIExplorer2048SnapshotTest : XCTestCase
{
  RCTTestRunner *_runner;
}

@end

@implementation UIExplorer2048SnapshotTest

- (void)setUp
{
  _runner = RCTInitRunnerForApp(@"Examples/2048/Game2048", nil);
  if ([[[UIDevice currentDevice] systemVersion] floatValue] >= 10) {
    _runner.testSuffix = @"-iOS10";
  }
  _runner.recordMode = NO;
}

- (void)test2048
{
  [_runner runTest:_cmd module:@"Game2048SnapshotTest"];
}

- (void)testZZZNotInRecordMode
{
  XCTAssertFalse(_runner.recordMode, @"Don't forget to turn record mode back to off");
}

@end
