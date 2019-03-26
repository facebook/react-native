/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

#import <XCTest/XCTest.h>

#import <React/RCTRootShadowView.h>
#import <React/RCTShadowView+Layout.h>
#import <React/RCTShadowView.h>


@interface RCTShadowViewTests : XCTestCase
@property (nonatomic, strong) RCTRootShadowView *parentView;
@end

@implementation RCTShadowViewTests

- (void)setUp
{
  [super setUp];

  self.parentView = [RCTRootShadowView new];
  YGNodeStyleSetFlexDirection(self.parentView.yogaNode, YGFlexDirectionColumn);
  YGNodeStyleSetWidth(self.parentView.yogaNode, 440);
  YGNodeStyleSetHeight(self.parentView.yogaNode, 440);
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
  RCTShadowView *leftView = [self _shadowViewWithConfig:^(YGNodeRef node) {
    YGNodeStyleSetFlex(node, 1);
  }];

  RCTShadowView *centerView = [self _shadowViewWithConfig:^(YGNodeRef node) {
    YGNodeStyleSetFlex(node, 2);
    YGNodeStyleSetMargin(node, YGEdgeLeft, 10);
    YGNodeStyleSetMargin(node, YGEdgeRight, 10);
  }];

  RCTShadowView *rightView = [self _shadowViewWithConfig:^(YGNodeRef node) {
    YGNodeStyleSetFlex(node, 1);
  }];

  RCTShadowView *mainView = [self _shadowViewWithConfig:^(YGNodeRef node) {
    YGNodeStyleSetFlexDirection(node, YGFlexDirectionRow);
    YGNodeStyleSetFlex(node, 2);
    YGNodeStyleSetMargin(node, YGEdgeTop, 10);
    YGNodeStyleSetMargin(node, YGEdgeBottom, 10);
  }];

  [mainView insertReactSubview:leftView atIndex:0];
  [mainView insertReactSubview:centerView atIndex:1];
  [mainView insertReactSubview:rightView atIndex:2];

  RCTShadowView *headerView = [self _shadowViewWithConfig:^(YGNodeRef node) {
    YGNodeStyleSetFlex(node, 1);
  }];

  RCTShadowView *footerView = [self _shadowViewWithConfig:^(YGNodeRef node) {
    YGNodeStyleSetFlex(node, 1);
  }];

  YGNodeStyleSetPadding(self.parentView.yogaNode, YGEdgeLeft, 10);
  YGNodeStyleSetPadding(self.parentView.yogaNode, YGEdgeTop, 10);
  YGNodeStyleSetPadding(self.parentView.yogaNode, YGEdgeRight, 10);
  YGNodeStyleSetPadding(self.parentView.yogaNode, YGEdgeBottom, 10);

  [self.parentView insertReactSubview:headerView atIndex:0];
  [self.parentView insertReactSubview:mainView atIndex:1];
  [self.parentView insertReactSubview:footerView atIndex:2];

  [self.parentView layoutWithAffectedShadowViews:[NSHashTable weakObjectsHashTable]];

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
  RCTShadowView *centerView = [self _shadowViewWithConfig:^(YGNodeRef node) {
    YGNodeStyleSetFlex(node, 1);
  }];

  RCTShadowView *mainView = [self _shadowViewWithConfig:^(YGNodeRef node) {
    YGNodeStyleSetFlex(node, 1);
  }];

  [mainView insertReactSubview:centerView atIndex:0];

  RCTShadowView *footerView = [self _shadowViewWithConfig:^(YGNodeRef node) {
    YGNodeStyleSetFlex(node, 1);
  }];

  [self.parentView insertReactSubview:mainView atIndex:0];
  [self.parentView insertReactSubview:footerView atIndex:1];

  XCTAssertTrue([centerView viewIsDescendantOf:mainView]);
  XCTAssertFalse([footerView viewIsDescendantOf:mainView]);
}

- (void)testAssignsSuggestedWidthDimension
{
  [self _withShadowViewWithStyle:^(YGNodeRef node) {
                                   YGNodeStyleSetPositionType(node, YGPositionTypeAbsolute);
                                   YGNodeStyleSetPosition(node, YGEdgeLeft, 0);
                                   YGNodeStyleSetPosition(node, YGEdgeTop, 0);
                                   YGNodeStyleSetHeight(node, 10);
                                 }
            assertRelativeLayout:CGRectMake(0, 0, 3, 10)
        withIntrinsicContentSize:CGSizeMake(3, UIViewNoIntrinsicMetric)];
}

- (void)testAssignsSuggestedHeightDimension
{
  [self _withShadowViewWithStyle:^(YGNodeRef node) {
                                   YGNodeStyleSetPositionType(node, YGPositionTypeAbsolute);
                                   YGNodeStyleSetPosition(node, YGEdgeLeft, 0);
                                   YGNodeStyleSetPosition(node, YGEdgeTop, 0);
                                   YGNodeStyleSetWidth(node, 10);
                                 }
            assertRelativeLayout:CGRectMake(0, 0, 10, 4)
        withIntrinsicContentSize:CGSizeMake(UIViewNoIntrinsicMetric, 4)];
}

- (void)testDoesNotOverrideDimensionStyleWithSuggestedDimensions
{
  [self _withShadowViewWithStyle:^(YGNodeRef node) {
                                   YGNodeStyleSetPositionType(node, YGPositionTypeAbsolute);
                                   YGNodeStyleSetPosition(node, YGEdgeLeft, 0);
                                   YGNodeStyleSetPosition(node, YGEdgeTop, 0);
                                   YGNodeStyleSetWidth(node, 10);
                                   YGNodeStyleSetHeight(node, 10);
                                 }
          assertRelativeLayout:CGRectMake(0, 0, 10, 10)
      withIntrinsicContentSize:CGSizeMake(3, 4)];
}

- (void)testDoesNotAssignSuggestedDimensionsWhenStyledWithFlexAttribute
{
  float parentWidth = YGNodeStyleGetWidth(self.parentView.yogaNode).value;
  float parentHeight = YGNodeStyleGetHeight(self.parentView.yogaNode).value;
  [self _withShadowViewWithStyle:^(YGNodeRef node) {
                                   YGNodeStyleSetFlex(node, 1);
                                 }
            assertRelativeLayout:CGRectMake(0, 0, parentWidth, parentHeight)
        withIntrinsicContentSize:CGSizeMake(3, 4)];
}

- (void)_withShadowViewWithStyle:(void(^)(YGNodeRef node))configBlock
            assertRelativeLayout:(CGRect)expectedRect
        withIntrinsicContentSize:(CGSize)contentSize
{
  RCTShadowView *view = [self _shadowViewWithConfig:configBlock];
  [self.parentView insertReactSubview:view atIndex:0];
  view.intrinsicContentSize = contentSize;
  [self.parentView layoutWithAffectedShadowViews:[NSHashTable weakObjectsHashTable]];
  CGRect actualRect = [view measureLayoutRelativeToAncestor:self.parentView];
  XCTAssertTrue(CGRectEqualToRect(expectedRect, actualRect),
                @"Expected layout to be %@, got %@",
                NSStringFromCGRect(expectedRect),
                NSStringFromCGRect(actualRect));
}

- (RCTShadowView *)_shadowViewWithConfig:(void(^)(YGNodeRef node))configBlock
{
  RCTShadowView *shadowView = [RCTShadowView new];
  configBlock(shadowView.yogaNode);
  return shadowView;
}


@end
