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

#import <React/RCTBridge.h>
#import <React/RCTDevMenu.h>

typedef void(^RCTDevMenuAlertActionHandler)(UIAlertAction *action);

@interface RCTDevMenu ()

- (RCTDevMenuAlertActionHandler)alertActionHandlerForDevItem:(RCTDevMenuItem *)item;

@end

@interface RCTDevMenuTests : XCTestCase

@end

@implementation RCTDevMenuTests
{
  RCTBridge *_bridge;
}

- (void)setUp
{
  [super setUp];

  NSBundle *bundle = [NSBundle bundleForClass:[self class]];
  _bridge = [[RCTBridge alloc] initWithBundleURL:[bundle URLForResource:@"UIExplorerUnitTestsBundle" withExtension:@"js"]
                                  moduleProvider:nil
                                   launchOptions:nil];
}

- (void)testShowCreatingActionSheet
{
  XCTAssertFalse([_bridge.devMenu isActionSheetShown]);
  [_bridge.devMenu show];
  XCTAssertTrue([_bridge.devMenu isActionSheetShown]);
}


- (void)testClosingActionSheetAfterAction
{
  for (RCTDevMenuItem *item in _bridge.devMenu.presentedItems) {
    RCTDevMenuAlertActionHandler handler = [_bridge.devMenu alertActionHandlerForDevItem:item];
    XCTAssertTrue([_bridge.devMenu isActionSheetShown]);

    handler(nil);
    XCTAssertFalse([_bridge.devMenu isActionSheetShown]);

    [_bridge.devMenu show];
    XCTAssertTrue([_bridge.devMenu isActionSheetShown]);
  }
}

@end
