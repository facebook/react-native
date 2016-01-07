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

@interface RCTShadowViewTests : XCTestCase

@end

@implementation RCTShadowViewTests

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

  RCTShadowView *parentView = [self _shadowViewWithStyle:^(css_style_t *style) {
    style->flex_direction = CSS_FLEX_DIRECTION_COLUMN;
    style->padding[0] = 10;
    style->padding[1] = 10;
    style->padding[2] = 10;
    style->padding[3] = 10;
    style->dimensions[0] = 440;
    style->dimensions[1] = 440;
  }];

  [parentView insertReactSubview:headerView atIndex:0];
  [parentView insertReactSubview:mainView atIndex:1];
  [parentView insertReactSubview:footerView atIndex:2];

  parentView.reactTag = @1; // must be valid rootView tag
  [parentView collectRootUpdatedFrames];

  XCTAssertTrue(CGRectEqualToRect([parentView measureLayoutRelativeToAncestor:parentView], CGRectMake(0, 0, 440, 440)));
  XCTAssertTrue(UIEdgeInsetsEqualToEdgeInsets([parentView paddingAsInsets], UIEdgeInsetsMake(10, 10, 10, 10)));

  XCTAssertTrue(CGRectEqualToRect([headerView measureLayoutRelativeToAncestor:parentView], CGRectMake(10, 10, 420, 100)));
  XCTAssertTrue(CGRectEqualToRect([mainView measureLayoutRelativeToAncestor:parentView], CGRectMake(10, 120, 420, 200)));
  XCTAssertTrue(CGRectEqualToRect([footerView measureLayoutRelativeToAncestor:parentView], CGRectMake(10, 330, 420, 100)));

  XCTAssertTrue(CGRectEqualToRect([leftView measureLayoutRelativeToAncestor:parentView], CGRectMake(10, 120, 100, 200)));
  XCTAssertTrue(CGRectEqualToRect([centerView measureLayoutRelativeToAncestor:parentView], CGRectMake(120, 120, 200, 200)));
  XCTAssertTrue(CGRectEqualToRect([rightView measureLayoutRelativeToAncestor:parentView], CGRectMake(330, 120, 100, 200)));
}

- (RCTShadowView *)_shadowViewWithStyle:(void(^)(css_style_t *style))styleBlock
{
  RCTShadowView *shadowView = [RCTShadowView new];

  css_style_t style = shadowView.cssNode->style;
  styleBlock(&style);
  shadowView.cssNode->style = style;

  return shadowView;
}

@end
