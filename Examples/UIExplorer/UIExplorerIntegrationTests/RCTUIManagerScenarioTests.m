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

#import "RCTShadowView.h"
#import "RCTUIManager.h"
#import "RCTRootView.h"
#import "RCTSparseArray.h"
#import "UIView+React.h"

@interface RCTUIManager (Testing)

- (void)_manageChildren:(NSNumber *)containerReactTag
      addChildReactTags:(NSArray *)addChildReactTags
           addAtIndices:(NSArray *)addAtIndices
        removeAtIndices:(NSArray *)removeAtIndices
               registry:(RCTSparseArray *)registry;

- (void)modifyManageChildren:(NSNumber *)containerReactTag
           addChildReactTags:(NSMutableArray *)mutableAddChildReactTags
                addAtIndices:(NSMutableArray *)mutableAddAtIndices
             removeAtIndices:(NSMutableArray *)mutableRemoveAtIndices;

- (void)createView:(NSNumber *)reactTag
          viewName:(NSString *)viewName
           rootTag:(NSNumber *)rootTag
             props:(NSDictionary *)props;

- (void)updateView:(NSNumber *)reactTag
          viewName:(NSString *)viewName
             props:(NSDictionary *)props;

- (void)manageChildren:(NSNumber *)containerReactTag
       moveFromIndices:(NSArray *)moveFromIndices
         moveToIndices:(NSArray *)moveToIndices
     addChildReactTags:(NSArray *)addChildReactTags
          addAtIndices:(NSArray *)addAtIndices
       removeAtIndices:(NSArray *)removeAtIndices;

- (void)flushUIBlocks;

@property (nonatomic, readonly) RCTSparseArray *viewRegistry;
@property (nonatomic, readonly) RCTSparseArray *shadowViewRegistry; // RCT thread only

@end

@interface RCTUIManagerScenarioTests : XCTestCase

@property (nonatomic, readwrite, strong) RCTUIManager *uiManager;

@end

@implementation RCTUIManagerScenarioTests

- (void)setUp
{
  [super setUp];

  _uiManager = [[RCTUIManager alloc] init];

  // Register 20 views to use in the tests
  for (NSInteger i = 1; i <= 20; i++) {
    UIView *registeredView = [[UIView alloc] init];
    [registeredView setReactTag:@(i)];
    _uiManager.viewRegistry[i] = registeredView;

    RCTShadowView *registeredShadowView = [[RCTShadowView alloc] init];
    registeredShadowView.viewName = @"RCTView";
    [registeredShadowView setReactTag:@(i)];
    _uiManager.shadowViewRegistry[i] = registeredShadowView;
  }
}

/* +-----------------------------------------------------------+  +----------------------+
 * |                     Shadow Hierarchy                      |  |        Legend        |
 * +-----------------------------------------------------------+  +----------------------+
 * |                                                           |  |                      |
 * |                 +---+                          ******     |  | ******************** |
 * |                 | 1 |                          * 11 *     |  | * Layout-only View * |
 * |                 +---+                          ******     |  | ******************** |
 * |                   |                               |       |  |                      |
 * |       +-------+---+---+----------+            +---+---+   |  | +----+               |
 * |       |       |       |          |            |       |   |  | |View|    Subview    |
 * |       v       v       v          v            v       v   |  | +----+  -----------> |
 * |     *****   +---+   *****      +---+       +----+  +----+ |  |                      |
 * |     * 2 *   | 3 |   * 4 *      | 5 |       | 12 |  | 13 | |  +----------------------+
 * |     *****   +---+   *****      +---+       +----+  +----+ |
 * |       |               |          |                        |
 * |   +---+--+            |      +---+---+                    |
 * |   |      |            |      |       |                    |
 * |   v      v            v      v       v                    |
 * | +---+  +---+        +---+  +---+  ******                  |
 * | | 6 |  | 7 |        | 8 |  | 9 |  * 10 *                  |
 * | +---+  +---+        +---+  +---+  ******                  |
 * |                                                           |
 * +-----------------------------------------------------------+
 *
 * +-----------------------------------------------------------+
 * |                      View Hierarchy                       |
 * +-----------------------------------------------------------+
 * |                                                           |
 * |                 +---+                         ******      |
 * |                 | 1 |                         * 11 *      |
 * |                 +---+                         ******      |
 * |                   |                              |        |
 * |     +------+------+------+------+            +---+---+    |
 * |     |      |      |      |      |            |       |    |
 * |     v      v      v      v      v            v       v    |
 * |   +---+  +---+  +---+  +---+  +---+       +----+  +----+  |
 * |   | 6 |  | 7 |  | 3 |  | 8 |  | 5 |       | 12 |  | 13 |  |
 * |   +---+  +---+  +---+  +---+  +---+       +----+  +----+  |
 * |                                 |                         |
 * |                                 v                         |
 * |                               +---+                       |
 * |                               | 9 |                       |
 * |                               +---+                       |
 * |                                                           |
 * +-----------------------------------------------------------+
 */

- (void)updateShadowViewWithReactTag:(NSNumber *)reactTag layoutOnly:(BOOL)isLayoutOnly childTags:(NSArray *)childTags
{
  RCTShadowView *shadowView = _uiManager.shadowViewRegistry[reactTag];
  shadowView.allProps = isLayoutOnly ? @{} : @{@"collapsible": @NO};
  [childTags enumerateObjectsUsingBlock:^(NSNumber *childTag, NSUInteger idx, __unused BOOL *stop) {
    [shadowView insertReactSubview:_uiManager.shadowViewRegistry[childTag] atIndex:idx];
  }];
}

- (void)setUpShadowViewHierarchy
{
  [self updateShadowViewWithReactTag:@1 layoutOnly:NO childTags:@[@2, @3, @4, @5]];
  [self updateShadowViewWithReactTag:@2 layoutOnly:YES childTags:@[@6, @7]];
  [self updateShadowViewWithReactTag:@3 layoutOnly:NO childTags:nil];
  [self updateShadowViewWithReactTag:@4 layoutOnly:YES childTags:@[@8]];
  [self updateShadowViewWithReactTag:@5 layoutOnly:NO childTags:@[@9, @10]];
  [self updateShadowViewWithReactTag:@6 layoutOnly:NO childTags:nil];
  [self updateShadowViewWithReactTag:@7 layoutOnly:NO childTags:nil];
  [self updateShadowViewWithReactTag:@8 layoutOnly:NO childTags:nil];
  [self updateShadowViewWithReactTag:@9 layoutOnly:NO childTags:nil];
  [self updateShadowViewWithReactTag:@10 layoutOnly:YES childTags:nil];
  [self updateShadowViewWithReactTag:@11 layoutOnly:YES childTags:@[@12, @13]];
  [self updateShadowViewWithReactTag:@12 layoutOnly:NO childTags:nil];
  [self updateShadowViewWithReactTag:@13 layoutOnly:NO childTags:nil];
}

- (void)testModifyIndices1
{
  [self setUpShadowViewHierarchy];

  NSMutableArray *addTags = [@[@2] mutableCopy];
  NSMutableArray *addIndices = [@[@3] mutableCopy];
  NSMutableArray *removeIndices = [@[@0] mutableCopy];
  [self.uiManager modifyManageChildren:@1
                     addChildReactTags:addTags
                          addAtIndices:addIndices
                       removeAtIndices:removeIndices];
  XCTAssertEqualObjects(addTags, (@[@6, @7]));
  XCTAssertEqualObjects(addIndices, (@[@3, @4]));
  XCTAssertEqualObjects(removeIndices, (@[@0, @1]));
}

- (void)testModifyIndices2
{
  [self setUpShadowViewHierarchy];

  NSMutableArray *addTags = [@[@11] mutableCopy];
  NSMutableArray *addIndices = [@[@4] mutableCopy];
  NSMutableArray *removeIndices = [@[] mutableCopy];
  [self.uiManager modifyManageChildren:@1
                     addChildReactTags:addTags
                          addAtIndices:addIndices
                       removeAtIndices:removeIndices];
  XCTAssertEqualObjects(addTags, (@[@12, @13]));
  XCTAssertEqualObjects(addIndices, (@[@5, @6]));
  XCTAssertEqualObjects(removeIndices, (@[]));
}

- (void)testModifyIndices3
{
  [self setUpShadowViewHierarchy];

  NSMutableArray *addTags = [@[] mutableCopy];
  NSMutableArray *addIndices = [@[] mutableCopy];
  NSMutableArray *removeIndices = [@[@2] mutableCopy];
  [self.uiManager modifyManageChildren:@1
                     addChildReactTags:addTags
                          addAtIndices:addIndices
                       removeAtIndices:removeIndices];
  XCTAssertEqualObjects(addTags, (@[]));
  XCTAssertEqualObjects(addIndices, (@[]));
  XCTAssertEqualObjects(removeIndices, (@[@3]));
}

- (void)testModifyIndices4
{
  [self setUpShadowViewHierarchy];

  NSMutableArray *addTags = [@[@11] mutableCopy];
  NSMutableArray *addIndices = [@[@3] mutableCopy];
  NSMutableArray *removeIndices = [@[@2] mutableCopy];
  [self.uiManager modifyManageChildren:@1
                     addChildReactTags:addTags
                          addAtIndices:addIndices
                       removeAtIndices:removeIndices];
  XCTAssertEqualObjects(addTags, (@[@12, @13]));
  XCTAssertEqualObjects(addIndices, (@[@4, @5]));
  XCTAssertEqualObjects(removeIndices, (@[@3]));
}

- (void)testModifyIndices5
{
  [self setUpShadowViewHierarchy];

  NSMutableArray *addTags = [@[] mutableCopy];
  NSMutableArray *addIndices = [@[] mutableCopy];
  NSMutableArray *removeIndices = [@[@0, @1, @2, @3] mutableCopy];
  [self.uiManager modifyManageChildren:@1
                     addChildReactTags:addTags
                          addAtIndices:addIndices
                       removeAtIndices:removeIndices];
  XCTAssertEqualObjects(addTags, (@[]));
  XCTAssertEqualObjects(addIndices, (@[]));
  XCTAssertEqualObjects(removeIndices, (@[@0, @1, @2, @3, @4]));
}

- (void)testModifyIndices6
{
  [self setUpShadowViewHierarchy];

  NSMutableArray *addTags = [@[@11] mutableCopy];
  NSMutableArray *addIndices = [@[@0] mutableCopy];
  NSMutableArray *removeIndices = [@[@0, @1, @2, @3] mutableCopy];
  [self.uiManager modifyManageChildren:@1
                     addChildReactTags:addTags
                          addAtIndices:addIndices
                       removeAtIndices:removeIndices];
  XCTAssertEqualObjects(addTags, (@[@12, @13]));
  XCTAssertEqualObjects(addIndices, (@[@0, @1]));
  XCTAssertEqualObjects(removeIndices, (@[@0, @1, @2, @3, @4]));
}

- (void)testModifyIndices7
{
  [self setUpShadowViewHierarchy];

  NSMutableArray *addTags = [@[@11] mutableCopy];
  NSMutableArray *addIndices = [@[@1] mutableCopy];
  NSMutableArray *removeIndices = [@[@0, @2, @3] mutableCopy];
  [self.uiManager modifyManageChildren:@1
                     addChildReactTags:addTags
                          addAtIndices:addIndices
                       removeAtIndices:removeIndices];
  XCTAssertEqualObjects(addTags, (@[@12, @13]));
  XCTAssertEqualObjects(addIndices, (@[@1, @2]));
  XCTAssertEqualObjects(removeIndices, (@[@0, @1, @3, @4]));
}

- (void)DISABLED_testScenario1
{
  RCTUIManager *uiManager = [[RCTUIManager alloc] init];
  RCTBridge *bridge = [[RCTBridge alloc] initWithBundleURL:nil moduleProvider:^{ return @[uiManager]; } launchOptions:nil];
  NS_VALID_UNTIL_END_OF_SCOPE RCTRootView *rootView = [[RCTRootView alloc] initWithBridge:bridge moduleName:@"Test"];

  __block BOOL done = NO;

  dispatch_queue_t shadowQueue = [uiManager valueForKey:@"shadowQueue"];
  dispatch_async(shadowQueue, ^{
    // Make sure root view finishes loading.
    dispatch_sync(dispatch_get_main_queue(), ^{});

    /*   */[uiManager createView:@2 viewName:@"RCTView" rootTag:@1 props:@{@"bottom":@0,@"left":@0,@"position":@"absolute",@"right":@0,@"top":@0}];
    /*   */[uiManager createView:@3 viewName:@"RCTView" rootTag:@1 props:@{@"bottom":@0,@"left":@0,@"position":@"absolute",@"right":@0,@"top":@0}];
    /* V */[uiManager createView:@4 viewName:@"RCTView" rootTag:@1 props:@{@"alignItems":@"center",@"backgroundColor":@"#F5FCFF",@"flex":@1,@"justifyContent":@"center"}];
    /* V */[uiManager createView:@5 viewName:@"RCTView" rootTag:@1 props:@{@"backgroundColor":@"blue",@"height":@50,@"width":@50}];
    /*   */[uiManager createView:@6 viewName:@"RCTView" rootTag:@1 props:@{@"width":@250}];
    /* V */[uiManager createView:@7 viewName:@"RCTView" rootTag:@1 props:@{@"borderWidth":@10,@"margin":@50}];
    /* V */[uiManager createView:@8 viewName:@"RCTView" rootTag:@1 props:@{@"backgroundColor":@"yellow",@"height":@50}];
    /* V */[uiManager createView:@9 viewName:@"RCTText" rootTag:@1 props:@{@"accessible":@1,@"fontSize":@20,@"isHighlighted":@0,@"margin":@10,@"textAlign":@"center"}];
    /*   */[uiManager createView:@10 viewName:@"RCTRawText" rootTag:@1 props:@{@"text":@"This tests removal of layout-only views."}];
    /*   */[uiManager manageChildren:@9 moveFromIndices:nil moveToIndices:nil addChildReactTags:@[@10] addAtIndices:@[@0] removeAtIndices:nil];
    /* V */[uiManager createView:@12 viewName:@"RCTView" rootTag:@1 props:@{@"backgroundColor":@"green",@"height":@50}];
    /*   */[uiManager manageChildren:@7 moveFromIndices:nil moveToIndices:nil addChildReactTags:@[@8,@9,@12] addAtIndices:@[@0,@1,@2] removeAtIndices:nil];
    /*   */[uiManager manageChildren:@6 moveFromIndices:nil moveToIndices:nil addChildReactTags:@[@7] addAtIndices:@[@0] removeAtIndices:nil];
    /* V */[uiManager createView:@13 viewName:@"RCTView" rootTag:@1 props:@{@"backgroundColor":@"red",@"height":@50,@"width":@50}];
    /*   */[uiManager manageChildren:@4 moveFromIndices:nil moveToIndices:nil addChildReactTags:@[@5,@6,@13] addAtIndices:@[@0,@1,@2] removeAtIndices:nil];
    /*   */[uiManager manageChildren:@3 moveFromIndices:nil moveToIndices:nil addChildReactTags:@[@4] addAtIndices:@[@0] removeAtIndices:nil];
    /*   */[uiManager manageChildren:@2 moveFromIndices:nil moveToIndices:nil addChildReactTags:@[@3] addAtIndices:@[@0] removeAtIndices:nil];
    /*   */[uiManager manageChildren:@1 moveFromIndices:nil moveToIndices:nil addChildReactTags:@[@2] addAtIndices:@[@0] removeAtIndices:nil];

    [uiManager addUIBlock:^(RCTUIManager *uiManager_, __unused RCTSparseArray *viewRegistry) {
      XCTAssertEqual(uiManager_.shadowViewRegistry.count, (NSUInteger)12);
      XCTAssertEqual(uiManager_.viewRegistry.count, (NSUInteger)8);
      done = YES;
    }];

    [uiManager flushUIBlocks];
  });

  NSDate *date = [NSDate dateWithTimeIntervalSinceNow:1.0];
  while ([date timeIntervalSinceNow] > 0 && !done) {
    [[NSRunLoop mainRunLoop] runMode:NSDefaultRunLoopMode beforeDate:[NSDate dateWithTimeIntervalSinceNow:0.1]];
    [[NSRunLoop mainRunLoop] runMode:NSRunLoopCommonModes beforeDate:[NSDate dateWithTimeIntervalSinceNow:0.1]];
  }

  done = NO;
  dispatch_async(shadowQueue, ^{
    [uiManager updateView:@7 viewName:@"RCTView" props:@{@"borderWidth":[NSNull null]}];
    [uiManager addUIBlock:^(RCTUIManager *uiManager_, __unused RCTSparseArray *viewRegistry) {
      XCTAssertEqual(uiManager_.shadowViewRegistry.count, (NSUInteger)12);
      XCTAssertEqual(uiManager_.viewRegistry.count, (NSUInteger)7);
      done = YES;
    }];

    [uiManager flushUIBlocks];
  });

  date = [NSDate dateWithTimeIntervalSinceNow:1.0];
  while ([date timeIntervalSinceNow] > 0 && !done) {
    [[NSRunLoop mainRunLoop] runMode:NSDefaultRunLoopMode beforeDate:[NSDate dateWithTimeIntervalSinceNow:0.1]];
    [[NSRunLoop mainRunLoop] runMode:NSRunLoopCommonModes beforeDate:[NSDate dateWithTimeIntervalSinceNow:0.1]];
  }

  done = NO;
  dispatch_async(shadowQueue, ^{
    [uiManager updateView:@7 viewName:@"RCTView" props:@{@"borderWidth":@10}];
    [uiManager addUIBlock:^(RCTUIManager *uiManager_, __unused RCTSparseArray *viewRegistry) {
      XCTAssertEqual(uiManager_.shadowViewRegistry.count, (NSUInteger)12);
      XCTAssertEqual(uiManager_.viewRegistry.count, (NSUInteger)8);
      done = YES;
    }];

    [uiManager flushUIBlocks];
  });

  date = [NSDate dateWithTimeIntervalSinceNow:1.0];
  while ([date timeIntervalSinceNow] > 0 && !done) {
    [[NSRunLoop mainRunLoop] runMode:NSDefaultRunLoopMode beforeDate:[NSDate dateWithTimeIntervalSinceNow:0.1]];
    [[NSRunLoop mainRunLoop] runMode:NSRunLoopCommonModes beforeDate:[NSDate dateWithTimeIntervalSinceNow:0.1]];
  }
}

- (void)DISABLED_testScenario2
{
  RCTUIManager *uiManager = [[RCTUIManager alloc] init];
  RCTBridge *bridge = [[RCTBridge alloc] initWithBundleURL:nil moduleProvider:^{ return @[uiManager]; } launchOptions:nil];
  NS_VALID_UNTIL_END_OF_SCOPE RCTRootView *rootView = [[RCTRootView alloc] initWithBridge:bridge moduleName:@"Test"];

  __block BOOL done = NO;

  dispatch_queue_t shadowQueue = [uiManager valueForKey:@"shadowQueue"];
  dispatch_async(shadowQueue, ^{
    // Make sure root view finishes loading.
    dispatch_sync(dispatch_get_main_queue(), ^{});

    /*   */[uiManager createView:@2 viewName:@"RCTView" rootTag:@1 props:@{@"bottom":@0,@"left":@0,@"position":@"absolute",@"right":@0,@"top":@0}];
    /*   */[uiManager createView:@3 viewName:@"RCTView" rootTag:@1 props:@{@"bottom":@0,@"left":@0,@"position":@"absolute",@"right":@0,@"top":@0}];
    /* V */[uiManager createView:@4 viewName:@"RCTView" rootTag:@1 props:@{@"alignItems":@"center",@"backgroundColor":@"#F5FCFF",@"flex":@1,@"justifyContent":@"center"}];
    /*   */[uiManager createView:@5 viewName:@"RCTView" rootTag:@1 props:@{@"width":@250}];
    /* V */[uiManager createView:@6 viewName:@"RCTView" rootTag:@1 props:@{@"borderWidth":@1}];
    /* V */[uiManager createView:@7 viewName:@"RCTText" rootTag:@1 props:@{@"accessible":@1,@"fontSize":@20,@"isHighlighted":@0,@"margin":@10,@"textAlign":@"center"}];
    /*   */[uiManager createView:@8 viewName:@"RCTRawText" rootTag:@1 props:@{@"text":@"This tests removal of layout-only views."}];
    /*   */[uiManager manageChildren:@7 moveFromIndices:nil moveToIndices:nil addChildReactTags:@[@8] addAtIndices:@[@0] removeAtIndices:nil];
    /*   */[uiManager manageChildren:@6 moveFromIndices:nil moveToIndices:nil addChildReactTags:@[@7] addAtIndices:@[@0] removeAtIndices:nil];
    /*   */[uiManager manageChildren:@5 moveFromIndices:nil moveToIndices:nil addChildReactTags:@[@6] addAtIndices:@[@0] removeAtIndices:nil];
    /*   */[uiManager manageChildren:@4 moveFromIndices:nil moveToIndices:nil addChildReactTags:@[@5] addAtIndices:@[@0] removeAtIndices:nil];
    /*   */[uiManager manageChildren:@3 moveFromIndices:nil moveToIndices:nil addChildReactTags:@[@4] addAtIndices:@[@0] removeAtIndices:nil];
    /*   */[uiManager manageChildren:@2 moveFromIndices:nil moveToIndices:nil addChildReactTags:@[@3] addAtIndices:@[@0] removeAtIndices:nil];
    /*   */[uiManager manageChildren:@1 moveFromIndices:nil moveToIndices:nil addChildReactTags:@[@2] addAtIndices:@[@0] removeAtIndices:nil];

    [uiManager addUIBlock:^(RCTUIManager *uiManager_, __unused RCTSparseArray *viewRegistry) {
      XCTAssertEqual(uiManager_.shadowViewRegistry.count, (NSUInteger)8);
      XCTAssertEqual(uiManager_.viewRegistry.count, (NSUInteger)4);
      done = YES;
    }];

    [uiManager flushUIBlocks];
  });

  NSDate *date = [NSDate dateWithTimeIntervalSinceNow:1.0];
  while ([date timeIntervalSinceNow] > 0 && !done) {
    [[NSRunLoop mainRunLoop] runMode:NSDefaultRunLoopMode beforeDate:[NSDate dateWithTimeIntervalSinceNow:0.1]];
    [[NSRunLoop mainRunLoop] runMode:NSRunLoopCommonModes beforeDate:[NSDate dateWithTimeIntervalSinceNow:0.1]];
  }

  done = NO;
  dispatch_async(shadowQueue, ^{
    [uiManager updateView:@6 viewName:@"RCTView" props:@{@"borderWidth":[NSNull null]}];
    [uiManager addUIBlock:^(RCTUIManager *uiManager_, __unused RCTSparseArray *viewRegistry) {
      XCTAssertEqual(uiManager_.shadowViewRegistry.count, (NSUInteger)8);
      XCTAssertEqual(uiManager_.viewRegistry.count, (NSUInteger)3);
      done = YES;
    }];

    [uiManager flushUIBlocks];
  });

  date = [NSDate dateWithTimeIntervalSinceNow:1.0];
  while ([date timeIntervalSinceNow] > 0 && !done) {
    [[NSRunLoop mainRunLoop] runMode:NSDefaultRunLoopMode beforeDate:[NSDate dateWithTimeIntervalSinceNow:0.1]];
    [[NSRunLoop mainRunLoop] runMode:NSRunLoopCommonModes beforeDate:[NSDate dateWithTimeIntervalSinceNow:0.1]];
  }

  done = NO;
  dispatch_async(shadowQueue, ^{
    [uiManager updateView:@6 viewName:@"RCTView" props:@{@"borderWidth":@1}];
    [uiManager addUIBlock:^(RCTUIManager *uiManager_, __unused RCTSparseArray *viewRegistry) {
      XCTAssertEqual(uiManager_.shadowViewRegistry.count, (NSUInteger)8);
      XCTAssertEqual(uiManager_.viewRegistry.count, (NSUInteger)4);
      done = YES;
    }];

    [uiManager flushUIBlocks];
  });

  date = [NSDate dateWithTimeIntervalSinceNow:1.0];
  while ([date timeIntervalSinceNow] > 0 && !done) {
    [[NSRunLoop mainRunLoop] runMode:NSDefaultRunLoopMode beforeDate:[NSDate dateWithTimeIntervalSinceNow:0.1]];
    [[NSRunLoop mainRunLoop] runMode:NSRunLoopCommonModes beforeDate:[NSDate dateWithTimeIntervalSinceNow:0.1]];
  }
}

@end
