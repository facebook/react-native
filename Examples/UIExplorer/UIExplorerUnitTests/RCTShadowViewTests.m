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

  self.parentView = [self _shadowViewWithStyle:^(css_style_t *style) {
    style->flex_direction = CSS_FLEX_DIRECTION_COLUMN;
    style->dimensions[0] = 440;
    style->dimensions[1] = 440;
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
  RCTShadowView *leftView = [self _shadowViewWithStyle:^(css_style_t *style) {
    style->flex = 1;
  }];

  RCTShadowView *centerView = [self _shadowViewWithStyle:^(css_style_t *style) {
    style->flex = 2;
    style->margin[0] = 10;
    style->margin[2] = 10;
  }];

  RCTShadowView *rightView = [self _shadowViewWithStyle:^(css_style_t *style) {
    style->flex = 1;
  }];

  RCTShadowView *mainView = [self _shadowViewWithStyle:^(css_style_t *style) {
    style->flex_direction = CSS_FLEX_DIRECTION_ROW;
    style->flex = 2;
    style->margin[1] = 10;
    style->margin[3] = 10;
  }];

  [mainView insertReactSubview:leftView atIndex:0];
  [mainView insertReactSubview:centerView atIndex:1];
  [mainView insertReactSubview:rightView atIndex:2];

  RCTShadowView *headerView = [self _shadowViewWithStyle:^(css_style_t *style) {
    style->flex = 1;
  }];

  RCTShadowView *footerView = [self _shadowViewWithStyle:^(css_style_t *style) {
    style->flex = 1;
  }];

  self.parentView.cssNode->style.padding[0] = 10;
  self.parentView.cssNode->style.padding[1] = 10;
  self.parentView.cssNode->style.padding[2] = 10;
  self.parentView.cssNode->style.padding[3] = 10;

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

- (void)testAssignsSuggestedWidthDimension
{
  [self _withShadowViewWithStyle:^(css_style_t *style) {
                                   style->position[CSS_LEFT] = 0;
                                   style->position[CSS_TOP] = 0;
                                   style->dimensions[CSS_HEIGHT] = 10;
                                 }
            assertRelativeLayout:CGRectMake(0, 0, 3, 10)
        withIntrinsicContentSize:CGSizeMake(3, UIViewNoIntrinsicMetric)];
}

- (void)testAssignsSuggestedHeightDimension
{
  [self _withShadowViewWithStyle:^(css_style_t *style) {
                                   style->position[CSS_LEFT] = 0;
                                   style->position[CSS_TOP] = 0;
                                   style->dimensions[CSS_WIDTH] = 10;
                                 }
            assertRelativeLayout:CGRectMake(0, 0, 10, 4)
        withIntrinsicContentSize:CGSizeMake(UIViewNoIntrinsicMetric, 4)];
}

- (void)testDoesNotOverrideDimensionStyleWithSuggestedDimensions
{
  [self _withShadowViewWithStyle:^(css_style_t *style) {
                                   style->position[CSS_LEFT] = 0;
                                   style->position[CSS_TOP] = 0;
                                   style->dimensions[CSS_WIDTH] = 10;
                                   style->dimensions[CSS_HEIGHT] = 10;
                                 }
          assertRelativeLayout:CGRectMake(0, 0, 10, 10)
      withIntrinsicContentSize:CGSizeMake(3, 4)];
}

- (void)testDoesNotAssignSuggestedDimensionsWhenStyledWithFlexAttribute
{
  float parentWidth = self.parentView.cssNode->style.dimensions[CSS_WIDTH];
  float parentHeight = self.parentView.cssNode->style.dimensions[CSS_HEIGHT];
  [self _withShadowViewWithStyle:^(css_style_t *style) {
                                   style->flex = 1;
                                 }
            assertRelativeLayout:CGRectMake(0, 0, parentWidth, parentHeight)
        withIntrinsicContentSize:CGSizeMake(3, 4)];
}

- (void)_withShadowViewWithStyle:(void(^)(css_style_t *style))styleBlock
            assertRelativeLayout:(CGRect)expectedRect
        withIntrinsicContentSize:(CGSize)contentSize
{
  RCTShadowView *view = [self _shadowViewWithStyle:styleBlock];
  [self.parentView insertReactSubview:view atIndex:0];
  view.intrinsicContentSize = contentSize;
  [self.parentView collectViewsWithUpdatedFrames];
  CGRect actualRect = [view measureLayoutRelativeToAncestor:self.parentView];
  XCTAssertTrue(CGRectEqualToRect(expectedRect, actualRect),
                @"Expected layout to be %@, got %@",
                NSStringFromCGRect(expectedRect),
                NSStringFromCGRect(actualRect));
}

- (RCTRootShadowView *)_shadowViewWithStyle:(void(^)(css_style_t *style))styleBlock
{
  RCTRootShadowView *shadowView = [RCTRootShadowView new];

  css_style_t style = shadowView.cssNode->style;
  styleBlock(&style);
  shadowView.cssNode->style = style;

  return shadowView;
}

@end
