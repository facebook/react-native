/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

#import <CoreGraphics/CoreGraphics.h>
#import <Foundation/Foundation.h>
#import <UIKit/UIView.h>
#import <XCTest/XCTest.h>

#import <RCTImage/RCTImageUtils.h>

#define RCTAssertEqualPoints(a, b) { \
XCTAssertEqual(a.x, b.x); \
XCTAssertEqual(a.y, b.y); \
}

#define RCTAssertEqualSizes(a, b) { \
XCTAssertEqual(a.width, b.width); \
XCTAssertEqual(a.height, b.height); \
}

#define RCTAssertEqualRects(a, b) { \
RCTAssertEqualPoints(a.origin, b.origin); \
RCTAssertEqualSizes(a.size, b.size); \
}

@interface RCTImageUtilTests : XCTestCase

@end

@implementation RCTImageUtilTests

- (void)testLandscapeSourceLandscapeTarget
{
  CGSize content = {1000, 100};
  CGSize target = {100, 20};

  {
    CGRect expected = {CGPointZero, {100, 20}};
    CGRect result = RCTTargetRect(content, target, 1, RCTResizeModeStretch);
    RCTAssertEqualRects(expected, result);
  }

  {
    CGRect expected = {{0, 5}, {100, 10}};
    CGRect result = RCTTargetRect(content, target, 1, RCTResizeModeContain);
    RCTAssertEqualRects(expected, result);
  }

  {
    CGRect expected = {{-50, 0}, {200, 20}};
    CGRect result = RCTTargetRect(content, target, 1, RCTResizeModeCover);
    RCTAssertEqualRects(expected, result);
  }
}

- (void)testPortraitSourceLandscapeTarget
{
  CGSize content = {10, 100};
  CGSize target = {100, 20};

  {
    CGRect expected = {CGPointZero, {100, 20}};
    CGRect result = RCTTargetRect(content, target, 1, RCTResizeModeStretch);
    RCTAssertEqualRects(expected, result);
  }

  {
    CGRect expected = {{49, 0}, {2, 20}};
    CGRect result = RCTTargetRect(content, target, 1, RCTResizeModeContain);
    RCTAssertEqualRects(expected, result);
  }

  {
    CGRect expected = {{0, -490}, {100, 1000}};
    CGRect result = RCTTargetRect(content, target, 1, RCTResizeModeCover);
    RCTAssertEqualRects(expected, result);
  }
}

- (void)testPortraitSourcePortraitTarget
{
  CGSize content = {10, 100};
  CGSize target = {20, 50};

  {
    CGRect expected = {CGPointZero, {20, 50}};
    CGRect result = RCTTargetRect(content, target, 1, RCTResizeModeStretch);
    RCTAssertEqualRects(expected, result);
  }

  {
    CGRect expected = {{7,0}, {5, 50}};
    CGRect result = RCTTargetRect(content, target, 1, RCTResizeModeContain);
    RCTAssertEqualRects(expected, result);
  }

  {
    CGRect expected = {{0, -75}, {20, 200}};
    CGRect result = RCTTargetRect(content, target, 2, RCTResizeModeCover);
    RCTAssertEqualRects(expected, result);
  }
}

- (void)testRounding
{
  CGSize content = {10, 100};
  CGSize target = {20, 50};

  {
    CGRect expected = {{0, -75}, {20, 200}};
    CGRect result = RCTTargetRect(content, target, 1, RCTResizeModeCover);
    RCTAssertEqualRects(expected, result);
  }
}

- (void)testScaling
{
  CGSize content = {2, 2};
  CGSize target = {3, 3};

  CGRect expected = {CGPointZero, {3, 3}};
  CGRect result = RCTTargetRect(content, target, 1, RCTResizeModeStretch);
  RCTAssertEqualRects(expected, result);
}

@end
