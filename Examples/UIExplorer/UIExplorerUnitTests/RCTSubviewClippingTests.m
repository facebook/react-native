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

#import <objc/message.h>

#import <OCMock/OCMock.h>
#import <XCTest/XCTest.h>

#import "UIView+React.h"
#import "UIView+Private.h"
#import "RCTView.h"
#import "RCTScrollView.h"
#import "RCTRootView.h"
#import "RCTViewManager.h"
#import "RCTComponentData.h"


@interface RCTSubviewClippingTests : XCTestCase
@end

@implementation RCTSubviewClippingTests

- (void)testViewOverlappingBoundsOfClippingViewIsNotClipped
{
  RCTView *clippingView = [RCTView new];
  [clippingView rct_setRemovesClippedSubviews:YES];
  [clippingView reactSetFrame:CGRectMake(0, 0, 50, 50)];

  RCTView *childView = [RCTView new];
  [childView reactSetFrame:CGRectMake(25, 25, 50, 50)];
  [clippingView insertReactSubview:childView atIndex:0];
  [clippingView didUpdateReactSubviews];

  XCTAssertEqual(clippingView.subviews.count, 1u);
}

- (void)testViewOutsideBoundsOfClippingViewIsClipped
{
  RCTView *clippingView = [RCTView new];
  [clippingView rct_setRemovesClippedSubviews:YES];
  [clippingView reactSetFrame:CGRectMake(0, 0, 50, 50)];

  RCTView *childView = [RCTView new];
  [childView reactSetFrame:CGRectMake(50, 50, 50, 50)];
  [clippingView insertReactSubview:childView atIndex:0];
  [clippingView didUpdateReactSubviews];

  XCTAssertEqual(clippingView.subviews.count, 0u);
}

- (void)testTurningOnClippingShouldRemoveView
{
  RCTView *clippingView = [RCTView new];
  [clippingView reactSetFrame:CGRectMake(0, 0, 50, 50)];

  RCTView *childView = [RCTView new];
  [childView reactSetFrame:CGRectMake(50, 50, 50, 50)];
  [clippingView insertReactSubview:childView atIndex:0];
  [clippingView didUpdateReactSubviews];

  XCTAssertEqual(clippingView.subviews.count, 1u);
  [clippingView rct_setRemovesClippedSubviews:YES];
  XCTAssertEqual(clippingView.subviews.count, 0u);
}

- (void)testTurningOffClippingShouldAddViewBack
{
  RCTView *clippingView = [RCTView new];
  [clippingView rct_setRemovesClippedSubviews:YES];
  [clippingView reactSetFrame:CGRectMake(0, 0, 50, 50)];

  RCTView *childView = [RCTView new];
  [childView reactSetFrame:CGRectMake(50, 50, 50, 50)];
  [clippingView insertReactSubview:childView atIndex:0];
  [clippingView didUpdateReactSubviews];

  XCTAssertEqual(clippingView.subviews.count, 0u);
  [clippingView rct_setRemovesClippedSubviews:NO];
  XCTAssertEqual(clippingView.subviews.count, 1u);
}

- (void)testTransformedClippedViewBackToClippingViewAddsItBack
{
  RCTView *clippingView = [RCTView new];
  [clippingView rct_setRemovesClippedSubviews:YES];
  [clippingView reactSetFrame:CGRectMake(0, 0, 50, 50)];

  RCTView *childView = [RCTView new];
  [childView reactSetFrame:CGRectMake(50, 50, 50, 50)];
  [clippingView insertReactSubview:childView atIndex:0];
  [clippingView didUpdateReactSubviews];

  XCTAssertEqual(clippingView.subviews.count, 0u);

  // Setting the transform property on a view has to be done the same way RN from js would do it.
  // That unfortuantely involves some arbitrary-looking setup based on how RCTComponentData's internals works.
  id mockBridge = [OCMockObject mockForClass:[RCTBridge class]];
  [[[mockBridge stub] andReturn:[RCTViewManager new]] moduleForClass:OCMOCK_ANY];
  RCTComponentData *componentData = [[RCTComponentData alloc] initWithManagerClass:[RCTViewManager class] bridge:mockBridge];
  // this transform moves the childView to match bounds of its clippingView
  [componentData setProps:@{@"transform": @[@1,@0,@0,@0,@0,@1,@0,@0,@0,@0,@1,@0,@-50,@-50,@0,@1]} forView:childView];

  XCTAssertEqual(clippingView.subviews.count, 1u);
}

- (void)testMovingClippedViewBackToClippingViewAddsItBack
{
  RCTView *clippingView = [RCTView new];
  [clippingView rct_setRemovesClippedSubviews:YES];
  [clippingView reactSetFrame:CGRectMake(0, 0, 50, 50)];

  RCTView *childView = [RCTView new];
  [childView reactSetFrame:CGRectMake(50, 50, 50, 50)];
  [clippingView insertReactSubview:childView atIndex:0];
  [clippingView didUpdateReactSubviews];

  XCTAssertEqual(clippingView.subviews.count, 0u);
  [childView reactSetFrame:CGRectMake(0, 0, 50, 50)];
  XCTAssertEqual(clippingView.subviews.count, 1u);
}

- (void)testResizingClippingViewToContainClippedViewAddsTheClippedViewBack
{
  RCTView *clippingView = [RCTView new];
  [clippingView rct_setRemovesClippedSubviews:YES];
  [clippingView reactSetFrame:CGRectMake(0, 0, 50, 50)];

  RCTView *childView = [RCTView new];
  [childView reactSetFrame:CGRectMake(50, 50, 50, 50)];
  [clippingView insertReactSubview:childView atIndex:0];
  [clippingView didUpdateReactSubviews];

  XCTAssertEqual(clippingView.subviews.count, 0u);
  [clippingView reactSetFrame:(CGRect){{0,0},{100,100}}];
  XCTAssertEqual(clippingView.subviews.count, 1u);
}

#pragma mark - zIndex tests

/**
 This test case models a following setup:

            +--------+
            |        |
            |        |
     *****  |        |
     *C  *  |        |
     * +-*--+        |
     * | *  |        |
     *****  |        |
       |    |      z3|
       |    +---+----+
  +----+        |
  |    |        |
  |    |        |
  |    |      z2|
  |    +---+----+
  |        |
  |        |
  |        |
  |      z1|
  +--------+

 */
- (void)testZIndexOrderingIsPreservedAfterRetogglingClippingCase1
{
  RCTView *clippingView = [RCTView new];
  [clippingView reactSetFrame:CGRectMake(0, 0, 50, 50)];

  RCTView *childView1 = [RCTView new];
  [childView1 reactSetFrame:CGRectMake(-25, 75, 100, 100)];
  [childView1 setReactZIndex:1];
  [clippingView insertReactSubview:childView1 atIndex:0];

  RCTView *childView2 = [RCTView new];
  [childView2 reactSetFrame:CGRectMake(25, 25, 100, 100)];
  [childView2 setReactZIndex:2];
  [clippingView insertReactSubview:childView2 atIndex:0];

  RCTView *childView3 = [RCTView new];
  [childView3 reactSetFrame:CGRectMake(75, -25, 100, 100)];
  [childView3 setReactZIndex:3];
  [clippingView insertReactSubview:childView3 atIndex:0];
  [clippingView didUpdateReactSubviews];
  [clippingView clearSortedSubviews];

  XCTAssert(([clippingView.subviews isEqualToArray:@[childView1, childView2, childView3]]));
  [clippingView rct_setRemovesClippedSubviews:YES];
  XCTAssert(([clippingView.subviews isEqualToArray:@[childView2]]));
  [clippingView rct_setRemovesClippedSubviews:NO];
  XCTAssert(([clippingView.subviews isEqualToArray:@[childView1, childView2, childView3]]));
}

/**
 This test case models a following setup:

  **********
  *C       *
  *      +-*-----------+
  *      | *           |
  *      | *           |
  *      | *           |
  *      | *           |
  *      | *           |
  * +----+ *           |
  **********           |
    |    |             |
    |    |             |
    |    |             +---+
    |    |             |   |
    |    |             |   |
    |    |z3           |   |
    |    +---+---------+   |
    |        |             |
    |        |             |
    |        |             |
    |        |             |
    |z1      |             |
    +--------+             |
             |             |
             |             |
             |z2           |
             +-------------+
 */
- (void)testZIndexOrderingIsPreservedAfterRetogglingClippingCase2
{
  RCTView *clippingView = [RCTView new];
  [clippingView reactSetFrame:CGRectMake(0, 0, 100, 100)];

  RCTView *childView1 = [RCTView new];
  [childView1 reactSetFrame:CGRectMake(25, 75, 150, 150)];
  [childView1 setReactZIndex:1];
  [clippingView insertReactSubview:childView1 atIndex:0];

  RCTView *childView2 = [RCTView new];
  [childView2 reactSetFrame:CGRectMake(125, 125, 150, 150)];
  [childView2 setReactZIndex:2];
  [clippingView insertReactSubview:childView2 atIndex:0];

  RCTView *childView3 = [RCTView new];
  [childView3 reactSetFrame:CGRectMake(75, 25, 150, 150)];
  [childView3 setReactZIndex:3];
  [clippingView insertReactSubview:childView3 atIndex:0];
  [clippingView didUpdateReactSubviews];
  [clippingView clearSortedSubviews];

  XCTAssert(([clippingView.subviews isEqualToArray:@[childView1, childView2, childView3]]));
  [clippingView rct_setRemovesClippedSubviews:YES];
  XCTAssert(([clippingView.subviews isEqualToArray:@[childView1, childView3]]));
  [clippingView rct_setRemovesClippedSubviews:NO];
  XCTAssert(([clippingView.subviews isEqualToArray:@[childView1, childView2, childView3]]));
}

#pragma mark - recursive clipping tests

- (void)testNotDirectSubviewIsClipped
{
  RCTView *clippingView = [RCTView new];
  [clippingView rct_setRemovesClippedSubviews:YES];
  [clippingView reactSetFrame:CGRectMake(0, 0, 50, 50)];

  RCTView *directChildView = [RCTView new];
  [directChildView reactSetFrame:CGRectMake(0, 0, 50, 50)];
  [clippingView insertReactSubview:directChildView atIndex:0];
  [clippingView didUpdateReactSubviews];

  RCTView *deeperChildView = [RCTView new];
  [deeperChildView reactSetFrame:CGRectMake(0, 100, 50, 50)];
  [directChildView insertReactSubview:deeperChildView atIndex:0];
  [directChildView didUpdateReactSubviews];

  XCTAssertEqual(directChildView.subviews.count, 0u);
}

/** There are three views, top two ones clip and the bottom one is outside of the top one's bounds and in side of the middle one. */
- (void)testUpperClippingViewClips
{
  RCTView *upperClippingView = [RCTView new];
  [upperClippingView rct_setRemovesClippedSubviews:YES];
  [upperClippingView reactSetFrame:CGRectMake(0, 0, 50, 50)];

  RCTView *lowerClippingView = [RCTView new];
  [lowerClippingView reactSetFrame:CGRectMake(0, 0, 50, 100)];
  [lowerClippingView rct_setRemovesClippedSubviews:YES];
  [upperClippingView insertReactSubview:lowerClippingView atIndex:0];
  [upperClippingView didUpdateReactSubviews];

  RCTView *viewToBeClipped = [RCTView new];
  [viewToBeClipped reactSetFrame:CGRectMake(0, 50, 50, 50)];
  [lowerClippingView insertReactSubview:viewToBeClipped atIndex:0];
  [lowerClippingView didUpdateReactSubviews];

  XCTAssertEqual(upperClippingView.subviews.count, 1u);
  XCTAssertEqual(lowerClippingView.subviews.count, 0u);
}

#pragma mark - ScrollView tests

- (void)testScrollViewClips
{
  RCTScrollView *scrollView = [[RCTScrollView alloc] initWithEventDispatcher:[OCMockObject mockForClass:[RCTEventDispatcher class]]];
  [scrollView reactSetFrame:CGRectMake(0, 0, 320, 480)];
  [scrollView rct_setRemovesClippedSubviews:YES];
  RCTView *contentView = [RCTView new];
  [contentView rct_setRemovesClippedSubviews:YES];
  // Content view is big enough to fit all rows. It's an implementation detail of ScrollView.js.
  [contentView reactSetFrame:CGRectMake(0, 0, 320, 550)];

  [scrollView insertReactSubview:contentView atIndex:0];
  [scrollView didUpdateReactSubviews];

  RCTView *rowView1 = [RCTView new];
  [rowView1 reactSetFrame:CGRectMake(0, 0, 320, 50)];
  RCTView *rowView2 = [RCTView new];
  [rowView2 reactSetFrame:CGRectMake(0, 200, 320, 50)];
  RCTView *rowView3 = [RCTView new];
  [rowView3 reactSetFrame:CGRectMake(0, 500, 320, 50)];
  [contentView insertReactSubview:rowView1 atIndex:0];
  [contentView insertReactSubview:rowView2 atIndex:0];
  [contentView insertReactSubview:rowView3 atIndex:0];
  [contentView didUpdateReactSubviews];
  // This makes sure the direct subview of scrollView gets frame too (implementation detial).
  [scrollView layoutSubviews];

  XCTAssert([[NSSet setWithArray:contentView.subviews] isEqualToSet:[NSSet setWithArray:(@[rowView1, rowView2])]]);
}

- (void)testScrollViewClipsDuringScrolling
{
  // Scrollview will try to emit events during scrolling, so we need to use a "nice" mock.
  RCTScrollView *scrollView = [[RCTScrollView alloc] initWithEventDispatcher:[OCMockObject niceMockForClass:[RCTEventDispatcher class]]];
  [scrollView reactSetFrame:CGRectMake(0, 0, 320, 480)];
  [scrollView rct_setRemovesClippedSubviews:YES];
  scrollView.reactTag = @2;
  RCTView *contentView = [RCTView new];
  [contentView rct_setRemovesClippedSubviews:YES];
  // Content view is big enough to fit all rows. It's an implementation detail of ScrollView.js.
  [contentView reactSetFrame:CGRectMake(0, 0, 320, 550)];

  [scrollView insertReactSubview:contentView atIndex:0];
  [scrollView didUpdateReactSubviews];

  RCTView *rowView1 = [RCTView new];
  [rowView1 reactSetFrame:CGRectMake(0, 0, 320, 50)];
  RCTView *rowView2 = [RCTView new];
  [rowView2 reactSetFrame:CGRectMake(0, 200, 320, 50)];
  RCTView *rowView3 = [RCTView new];
  [rowView3 reactSetFrame:CGRectMake(0, 500, 320, 50)];
  [contentView insertReactSubview:rowView1 atIndex:0];
  [contentView insertReactSubview:rowView2 atIndex:0];
  [contentView insertReactSubview:rowView3 atIndex:0];
  [contentView didUpdateReactSubviews];
  // This makes sure the direct subview of scrollView gets frame too (implementation detial).
  [scrollView layoutSubviews];

  [scrollView scrollToOffset:CGPointMake(0, 100)];

  XCTAssert([[NSSet setWithArray:contentView.subviews] isEqualToSet:[NSSet setWithArray:(@[rowView2, rowView3])]]);
}


/**
 In this test case the react view hiearchy is
   clippingView -> directReactChildView -> deeperChildView
 while the uiview hierarchy is
   clippingView -> nonReactChildView -> directReactChildView -> deeperChildView
 */
- (void)testClippingWhenReactHierarchyDoesntMatchUIHierarchy
{
  RCTView *clippingView = [RCTView new];
  [clippingView reactSetFrame:CGRectMake(0, 0, 50, 50)];

  RCTView *directReactChildView = [RCTView new];
  [directReactChildView reactSetFrame:CGRectMake(-50, 0, 100, 50)];
  [clippingView insertReactSubview:directReactChildView atIndex:0];
  [clippingView didUpdateReactSubviews];

  RCTView *deeperChildView = [RCTView new];
  [deeperChildView reactSetFrame:CGRectMake(0, 0, 50, 50)];
  [directReactChildView insertReactSubview:deeperChildView atIndex:0];
  [directReactChildView didUpdateReactSubviews];

  UIView *nonReactChildView = [UIView new];
  [nonReactChildView setFrame:CGRectMake(50, 0, 50, 50)];
  [clippingView addSubview:nonReactChildView];
  [nonReactChildView addSubview:directReactChildView];

  [clippingView rct_setRemovesClippedSubviews:YES];
  [directReactChildView reactSetFrame:CGRectMake(-50, 0, 99, 50)];

  XCTAssertEqual(clippingView.subviews.count, 1u);
  XCTAssertEqual(nonReactChildView.subviews.count, 1u);
  XCTAssertEqual(directReactChildView.subviews.count, 1u);
}

@end
