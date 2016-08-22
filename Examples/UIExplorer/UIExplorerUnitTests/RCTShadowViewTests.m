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

#import "RCTShadowView.h"
#import "RCTRootShadowView.h"


@interface RCTShadowViewTests : XCTestCase
@property (nonatomic, strong) RCTRootShadowView *parentView;
@end

@implementation RCTShadowViewTests

- (void)setUp
{
  [super setUp];

  self.parentView = [self _shadowViewWithConfig:^(CSSNodeRef node) {
    CSSNodeStyleSetFlexDirection(node, CSSFlexDirectionColumn);
    CSSNodeStyleSetWidth(node, 440);
    CSSNodeStyleSetHeight(node, 440);
  }];
  self.parentView.reactTag = @1; // must be valid rootView tag
}

// Just a basic sanity test to ensure css-layout is applied correctly in the context of our shadow view hierarchy.
//
// ====================================
// ||             header             ||
// ====================================
// ||       ||              ||       ||
// || left  ||    center    || right ||
// ||       ||              ||       ||
// ====================================
// ||             footer             ||
// ====================================
//
- (void)testApplyingLayoutRecursivelyToShadowView
{
  RCTShadowView *leftView = [self _shadowViewWithConfig:^(CSSNodeRef node) {
    CSSNodeStyleSetFlex(node, 1);
  }];

  RCTShadowView *centerView = [self _shadowViewWithConfig:^(CSSNodeRef node) {
    CSSNodeStyleSetFlex(node, 2);
    CSSNodeStyleSetMargin(node, CSSEdgeLeft, 10);
    CSSNodeStyleSetMargin(node, CSSEdgeRight, 10);
  }];

  RCTShadowView *rightView = [self _shadowViewWithConfig:^(CSSNodeRef node) {
    CSSNodeStyleSetFlex(node, 1);
  }];

  RCTShadowView *mainView = [self _shadowViewWithConfig:^(CSSNodeRef node) {
    CSSNodeStyleSetFlexDirection(node, CSSFlexDirectionRow);
    CSSNodeStyleSetFlex(node, 2);
    CSSNodeStyleSetMargin(node, CSSEdgeTop, 10);
    CSSNodeStyleSetMargin(node, CSSEdgeBottom, 10);
  }];

  [mainView insertReactSubview:leftView atIndex:0];
  [mainView insertReactSubview:centerView atIndex:1];
  [mainView insertReactSubview:rightView atIndex:2];

  RCTShadowView *headerView = [self _shadowViewWithConfig:^(CSSNodeRef node) {
    CSSNodeStyleSetFlex(node, 1);
  }];

  RCTShadowView *footerView = [self _shadowViewWithConfig:^(CSSNodeRef node) {
    CSSNodeStyleSetFlex(node, 1);
  }];

  CSSNodeStyleSetPadding(self.parentView.cssNode, CSSEdgeLeft, 10);
  CSSNodeStyleSetPadding(self.parentView.cssNode, CSSEdgeTop, 10);
  CSSNodeStyleSetPadding(self.parentView.cssNode, CSSEdgeRight, 10);
  CSSNodeStyleSetPadding(self.parentView.cssNode, CSSEdgeBottom, 10);

  [self.parentView insertReactSubview:headerView atIndex:0];
  [self.parentView insertReactSubview:mainView atIndex:1];
  [self.parentView insertReactSubview:footerView atIndex:2];

  [self.parentView collectViewsWithUpdatedFrames];

  XCTAssertTrue(CGRectEqualToRect([self.parentView measureLayoutRelativeToAncestor:self.parentView], CGRectMake(0, 0, 440, 440)));
  XCTAssertTrue(UIEdgeInsetsEqualToEdgeInsets([self.parentView paddingAsInsets], UIEdgeInsetsMake(10, 10, 10, 10)));

  XCTAssertTrue(CGRectEqualToRect([headerView measureLayoutRelativeToAncestor:self.parentView], CGRectMake(10, 10, 420, 100)));
  XCTAssertTrue(CGRectEqualToRect([mainView measureLayoutRelativeToAncestor:self.parentView], CGRectMake(10, 120, 420, 200)));
  XCTAssertTrue(CGRectEqualToRect([footerView measureLayoutRelativeToAncestor:self.parentView], CGRectMake(10, 330, 420, 100)));

  XCTAssertTrue(CGRectEqualToRect([leftView measureLayoutRelativeToAncestor:self.parentView], CGRectMake(10, 120, 100, 200)));
  XCTAssertTrue(CGRectEqualToRect([centerView measureLayoutRelativeToAncestor:self.parentView], CGRectMake(120, 120, 200, 200)));
  XCTAssertTrue(CGRectEqualToRect([rightView measureLayoutRelativeToAncestor:self.parentView], CGRectMake(330, 120, 100, 200)));
}

- (void)testAncestorCheck
{
  RCTShadowView *centerView = [self _shadowViewWithConfig:^(CSSNodeRef node) {
    CSSNodeStyleSetFlex(node, 1);
  }];

  RCTShadowView *mainView = [self _shadowViewWithConfig:^(CSSNodeRef node) {
    CSSNodeStyleSetFlex(node, 1);
  }];

  [mainView insertReactSubview:centerView atIndex:0];

  RCTShadowView *footerView = [self _shadowViewWithConfig:^(CSSNodeRef node) {
    CSSNodeStyleSetFlex(node, 1);
  }];

  [self.parentView insertReactSubview:mainView atIndex:0];
  [self.parentView insertReactSubview:footerView atIndex:1];

  XCTAssertTrue([centerView viewIsDescendantOf:mainView]);
  XCTAssertFalse([footerView viewIsDescendantOf:mainView]);
}

- (void)testAssignsSuggestedWidthDimension
{
  [self _withShadowViewWithStyle:^(CSSNodeRef node) {
                                   CSSNodeStyleSetPosition(node, CSSEdgeLeft, 0);
                                   CSSNodeStyleSetPosition(node, CSSEdgeTop, 0);
                                   CSSNodeStyleSetHeight(node, 10);
                                 }
            assertRelativeLayout:CGRectMake(0, 0, 3, 10)
        withIntrinsicContentSize:CGSizeMake(3, UIViewNoIntrinsicMetric)];
}

- (void)testAssignsSuggestedHeightDimension
{
  [self _withShadowViewWithStyle:^(CSSNodeRef node) {
                                   CSSNodeStyleSetPosition(node, CSSEdgeLeft, 0);
                                   CSSNodeStyleSetPosition(node, CSSEdgeTop, 0);
                                   CSSNodeStyleSetWidth(node, 10);
                                 }
            assertRelativeLayout:CGRectMake(0, 0, 10, 4)
        withIntrinsicContentSize:CGSizeMake(UIViewNoIntrinsicMetric, 4)];
}

- (void)testDoesNotOverrideDimensionStyleWithSuggestedDimensions
{
  [self _withShadowViewWithStyle:^(CSSNodeRef node) {
                                   CSSNodeStyleSetPosition(node, CSSEdgeLeft, 0);
                                   CSSNodeStyleSetPosition(node, CSSEdgeTop, 0);
                                   CSSNodeStyleSetWidth(node, 10);
                                   CSSNodeStyleSetHeight(node, 10);
                                 }
          assertRelativeLayout:CGRectMake(0, 0, 10, 10)
      withIntrinsicContentSize:CGSizeMake(3, 4)];
}

- (void)testDoesNotAssignSuggestedDimensionsWhenStyledWithFlexAttribute
{
  float parentWidth = CSSNodeStyleGetWidth(self.parentView.cssNode);
  float parentHeight = CSSNodeStyleGetHeight(self.parentView.cssNode);
  [self _withShadowViewWithStyle:^(CSSNodeRef node) {
                                   CSSNodeStyleSetFlex(node, 1);
                                 }
            assertRelativeLayout:CGRectMake(0, 0, parentWidth, parentHeight)
        withIntrinsicContentSize:CGSizeMake(3, 4)];
}

- (void)_withShadowViewWithStyle:(void(^)(CSSNodeRef node))configBlock
            assertRelativeLayout:(CGRect)expectedRect
        withIntrinsicContentSize:(CGSize)contentSize
{
  RCTShadowView *view = [self _shadowViewWithConfig:configBlock];
  [self.parentView insertReactSubview:view atIndex:0];
  view.intrinsicContentSize = contentSize;
  [self.parentView collectViewsWithUpdatedFrames];
  CGRect actualRect = [view measureLayoutRelativeToAncestor:self.parentView];
  XCTAssertTrue(CGRectEqualToRect(expectedRect, actualRect),
                @"Expected layout to be %@, got %@",
                NSStringFromCGRect(expectedRect),
                NSStringFromCGRect(actualRect));
}

- (RCTRootShadowView *)_shadowViewWithConfig:(void(^)(CSSNodeRef node))configBlock
{
  RCTRootShadowView *shadowView = [RCTRootShadowView new];
  configBlock(shadowView.cssNode);
  return shadowView;
}

@end
