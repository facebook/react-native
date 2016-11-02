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
#import "RCTBridge.h"
#import "RCTDevMenu.h"


typedef void(^RCTDevMenuAlertActionHandler)(UIAlertAction *action);

@interface RCTDevMenu()

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
  _bridge = [[RCTBridge alloc] initWithBundleURL:[bundle URLForResource:@"TestBundle" withExtension:@"js"]
                                  moduleProvider:nil
                                   launchOptions:nil];
}

- (void)testShowCreatingActionSheet
{
  XCTAssertNil([_bridge.devMenu valueForKey:@"_actionSheet"]);
  [_bridge.devMenu show];
  XCTAssertNotNil([_bridge.devMenu valueForKey:@"_actionSheet"]);
}

- (void)testActionSheetHasExtraCancelButton
{
  UIAlertController *actionSheet = [_bridge.devMenu valueForKey:@"_actionSheet"];
  NSArray<UIAlertAction *> *actions = actionSheet.actions;
  NSArray<RCTDevMenuItem *> *devItems = [_bridge.devMenu valueForKey:@"_presentedItems"];
  XCTAssertEqual(actions.count, devItems.count);
  
  [_bridge.devMenu show];
  
  actionSheet = [_bridge.devMenu valueForKey:@"_actionSheet"];
  actions = actionSheet.actions;
  devItems = [_bridge.devMenu valueForKey:@"_presentedItems"];
  
  XCTAssertEqual(actions.count, devItems.count + 1);
}

- (void)testClosingActionSheetAfterAction
{
  NSArray<RCTDevMenuItem *> *devItems = [_bridge.devMenu valueForKey:@"_presentedItems"];
  for (RCTDevMenuItem *item in devItems) {
    RCTDevMenuAlertActionHandler handler = [_bridge.devMenu alertActionHandlerForDevItem:item];
    XCTAssertNotNil([_bridge.devMenu valueForKey:@"_actionSheet"]);
    
    handler(nil);
    XCTAssertNil([_bridge.devMenu valueForKey:@"_actionSheet"]);
    
    [_bridge.devMenu show];
    XCTAssertNotNil([_bridge.devMenu valueForKey:@"_actionSheet"]);
  }
}

@end
