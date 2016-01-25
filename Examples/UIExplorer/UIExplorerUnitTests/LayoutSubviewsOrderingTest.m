// Copyright 2004-present Facebook. All Rights Reserved.

#import <UIKit/UIKit.h>
#import <XCTest/XCTest.h>

#import <OCMock/OCMock.h>

@interface LayoutSubviewsOrderingTest : XCTestCase

@end

@implementation LayoutSubviewsOrderingTest

/**
 * This test exists to insure that didLayoutSubviews is always called immediately after layoutSubviews for a VC:View
 * pair. In Catalyst we have multiple levels of ViewController containment, and we rely on this ordering
 * to insure that layoutGuides are set on RKViewControllers before Views further down in the hierarchy have
 * their layoutSubviews called (and need to use the aforementioned layoutGuides)
 */
- (void)testLayoutSubviewsOrdering
{
  // create some Views and ViewControllers
  UIViewController *parentVC = [UIViewController new];
  UIView *parentView = [UIView new];
  UIViewController *childVC = [UIViewController new];
  UIView *childView = [UIView new];

  // The ordering we expect is:
  //   parentView::layoutSubviews
  //   parentVC::didLayoutSubviews
  //   childView::layoutSubviews
  //   childVC::didLayoutSubviews

  id parentViewMock = [OCMockObject partialMockForObject:parentView];
  id parentVCMock = [OCMockObject partialMockForObject:parentVC];
  id childViewMock = [OCMockObject partialMockForObject:childView];
  id childVCMock = [OCMockObject partialMockForObject:childVC];

  __block int layoutOrderCount = 0;
  [[[parentViewMock stub] andDo:^(NSInvocation *inv) {
    if (layoutOrderCount < 4) {
      layoutOrderCount++;
      XCTAssertEqual(layoutOrderCount, 1, @"Expect parentView::layoutSubviews to be called first");
    }
  }] layoutSubviews];
  [[[parentVCMock stub] andDo:^(NSInvocation *inv) {
    if (layoutOrderCount < 4) {
      layoutOrderCount++;
      XCTAssertEqual(layoutOrderCount, 2, @"Expect parentVC::viewDidLayoutSubviews to be called 2nd");
    }
  }] viewDidLayoutSubviews];
  [[[childViewMock stub] andDo:^(NSInvocation *inv) {
    if (layoutOrderCount < 4) {
      layoutOrderCount++;
      XCTAssertEqual(layoutOrderCount, 3, @"Expect childView::layoutSubviews to be called 3rd");
    }
  }] layoutSubviews];
  [[[childVCMock stub] andDo:^(NSInvocation *inv) {
    if (layoutOrderCount < 4) {
      layoutOrderCount++;
      XCTAssertEqual(layoutOrderCount, 4, @"Expect childVC::viewDidLayoutSubviews to be called last");
      [childVCMock stopMocking];
    }
  }] viewDidLayoutSubviews];

  // setup View hierarchy and force layout
  parentVC.view = parentView;
  childVC.view = childView;
  [parentVC addChildViewController:childVC];
  [childVC didMoveToParentViewController:parentVC];
  [parentView addSubview:childView];

  [childViewMock setNeedsLayout];
  [parentViewMock layoutIfNeeded];

  XCTAssertEqual(layoutOrderCount, 4, @"Expect layoutSubviews/viewDidLayoutSubviews to be called");
}

@end
