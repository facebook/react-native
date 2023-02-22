/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <XCTest/XCTest.h>
#import "OCMock/OCMock.h"

#import <React/RCTAutoInsetsProtocol.h>
#import <React/RCTMockDef.h>
#import <React/RCTScrollView.h>
#import <React/RCTView.h>
#import <React/RCTViewUtils.h>

RCT_MOCK_REF(RCTView, RCTContentInsets);

UIEdgeInsets gContentInsets;
static UIEdgeInsets RCTContentInsetsMock(UIView *view)
{
  return gContentInsets;
}

@interface RCTViewTests : XCTestCase
@end

@implementation RCTViewTests

- (void)testAutoAdjustInsetsUpdateOffsetNo
{
  RCT_MOCK_SET(RCTView, RCTContentInsets, RCTContentInsetsMock);

  RCTScrollView *parentView = OCMClassMock([RCTScrollView class]);
  OCMStub([parentView contentInset]).andReturn(UIEdgeInsetsMake(1, 1, 1, 1));
  OCMStub([parentView automaticallyAdjustContentInsets]).andReturn(YES);
  UIScrollView *scrollView = [[UIScrollView alloc] initWithFrame:CGRectZero];

  gContentInsets = UIEdgeInsetsMake(1, 2, 3, 4);
  [RCTView autoAdjustInsetsForView:parentView withScrollView:scrollView updateOffset:NO];

  XCTAssertTrue(UIEdgeInsetsEqualToEdgeInsets(scrollView.contentInset, UIEdgeInsetsMake(2, 3, 4, 5)));
  XCTAssertTrue(UIEdgeInsetsEqualToEdgeInsets(scrollView.scrollIndicatorInsets, UIEdgeInsetsMake(2, 3, 4, 5)));

  RCT_MOCK_RESET(RCTView, RCTContentInsets);
}

@end
