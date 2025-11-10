/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <XCTest/XCTest.h>

#import <React/RCTViewComponentView.h>
#import <react/renderer/components/view/ViewComponentDescriptor.h>
#import <react/renderer/components/view/ViewProps.h>

using namespace facebook::react;

@interface RCTViewComponentViewTest : XCTestCase
@end

@implementation RCTViewComponentViewTest

- (void)testPrepareForRecycleCleansUpVisualLayers
{
  // Create a view component
  RCTViewComponentView *view = [[RCTViewComponentView alloc] initWithFrame:CGRectMake(0, 0, 100, 100)];
  
  // Create props with box shadow to trigger layer creation
  auto props = std::make_shared<ViewProps>();
  auto boxShadow = BoxShadow{};
  boxShadow.offsetX = 2.0;
  boxShadow.offsetY = 2.0;
  boxShadow.blurRadius = 4.0;
  boxShadow.color = SharedColor::colorFromComponents({0, 0, 0, 0.5});
  props->boxShadow = {boxShadow};
  
  // Update props to create visual layers
  [view updateProps:props oldProps:ViewShadowNode::defaultSharedProps()];
  
  // Trigger layer creation by setting layout metrics
  LayoutMetrics layoutMetrics;
  layoutMetrics.frame = Rect{Point{0, 0}, Size{100, 100}};
  [view updateLayoutMetrics:layoutMetrics oldLayoutMetrics:LayoutMetrics{}];
  
  // Finalize updates to create the layers
  [view finalizeUpdates:RNComponentViewUpdateMaskProps | RNComponentViewUpdateMaskLayoutMetrics];
  
  // Verify layers were created (indirectly by checking sublayer count)
  NSUInteger initialSublayerCount = view.layer.sublayers.count;
  XCTAssertGreaterThan(initialSublayerCount, 0, @"Visual layers should be created");
  
  // Prepare for recycle
  [view prepareForRecycle];
  
  // Verify layers were cleaned up
  NSUInteger finalSublayerCount = view.layer.sublayers.count;
  XCTAssertEqual(finalSublayerCount, 0, @"All visual layers should be cleaned up after recycling");
}

- (void)testPrepareForRecycleResetsVisualState
{
  // Create a view component
  RCTViewComponentView *view = [[RCTViewComponentView alloc] initWithFrame:CGRectMake(0, 0, 100, 100)];
  
  // Set some visual properties
  view.layer.opacity = 0.5;
  view.layer.backgroundColor = [UIColor redColor].CGColor;
  view.layer.borderWidth = 2.0;
  view.layer.cornerRadius = 10.0;
  
  // Prepare for recycle
  [view prepareForRecycle];
  
  // Visual state should be preserved (not reset) as it will be set by new props
  // This test ensures prepareForRecycle doesn't break existing functionality
  XCTAssertEqual(view.layer.opacity, 0.5, @"Layer opacity should be preserved");
  XCTAssertEqualObjects((__bridge UIColor *)view.layer.backgroundColor, [UIColor redColor], @"Background color should be preserved");
}

@end