/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

#import <UIKit/UIKit.h>
#import <XCTest/XCTest.h>

#if (defined(COCOAPODS))
#import <React-RCTTest/React/RCTTestRunner.h>
#import <React-Core/React/RCTEventDispatcher.h>
#import <React-Core/React/RCTRootView.h>
#import <React-Core/React/RCTRootViewDelegate.h>
#else
#import <RCTTest/RCTTestRunner.h>
#import <React/RCTEventDispatcher.h>
#import <React/RCTRootView.h>
#import <React/RCTRootViewDelegate.h>
#endif

#define RCT_TEST_DATA_CONFIGURATION_BLOCK(appName, testType, input, block) \
- (void)DISABLED_test##appName##_##testType##_##input                      \
{                                                                          \
  [_runner runTest:_cmd                                                    \
            module:@#appName                                               \
      initialProps:@{@#input:@YES}                                         \
configurationBlock:block];                                                 \
}

#define RCT_TEST_CONFIGURATION_BLOCK(appName, block)  \
- (void)DISABLED_test##appName                        \
{                                                     \
  [_runner runTest:_cmd                               \
            module:@#appName                          \
      initialProps:nil                                \
configurationBlock:block];                            \
}

#define RCTNone   RCTRootViewSizeFlexibilityNone
#define RCTHeight RCTRootViewSizeFlexibilityHeight
#define RCTWidth  RCTRootViewSizeFlexibilityWidth
#define RCTBoth   RCTRootViewSizeFlexibilityWidthAndHeight

typedef void (^ControlBlock)(RCTRootView*);

@interface SizeFlexibilityTestDelegate : NSObject<RCTRootViewDelegate>
@end

@implementation SizeFlexibilityTestDelegate

- (void)rootViewDidChangeIntrinsicSize:(RCTRootView *)rootView
{
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"

  [rootView.bridge.eventDispatcher sendAppEventWithName:@"rootViewDidChangeIntrinsicSize"
                                                   body:@{@"width": @(rootView.intrinsicSize.width),
                                                          @"height": @(rootView.intrinsicSize.height)}];
#pragma clang diagnostic pop
}

@end

static SizeFlexibilityTestDelegate *sizeFlexibilityDelegate()
{
  static SizeFlexibilityTestDelegate *delegate;
  if (delegate == nil) {
    delegate = [SizeFlexibilityTestDelegate new];
  }

  return delegate;
}

static ControlBlock simpleSizeFlexibilityBlock(RCTRootViewSizeFlexibility sizeFlexibility)
{
  return ^(RCTRootView *rootView){
    rootView.delegate = sizeFlexibilityDelegate();
    rootView.sizeFlexibility = sizeFlexibility;
  };
}

static ControlBlock multipleSizeFlexibilityUpdatesBlock(RCTRootViewSizeFlexibility finalSizeFlexibility)
{
  return ^(RCTRootView *rootView){

    NSInteger arr[4] = {RCTNone,
                        RCTHeight,
                        RCTWidth,
                        RCTBoth};

    rootView.delegate = sizeFlexibilityDelegate();

    for (int i = 0; i < 4; ++i) {
      if (arr[i] != finalSizeFlexibility) {
        rootView.sizeFlexibility = arr[i];
      }
    }

    rootView.sizeFlexibility = finalSizeFlexibility;
  };
}

static ControlBlock reactContentSizeUpdateBlock(RCTRootViewSizeFlexibility sizeFlexibility)
{
  return ^(RCTRootView *rootView){
    rootView.delegate = sizeFlexibilityDelegate();
    rootView.sizeFlexibility = sizeFlexibility;
  };
}

@interface RCTRootViewIntegrationTests : XCTestCase

@end

@implementation RCTRootViewIntegrationTests
{
  RCTTestRunner *_runner;
}

- (void)setUp
{
  _runner = RCTInitRunnerForApp(@"IntegrationTests/RCTRootViewIntegrationTestApp", nil, nil);
}

#pragma mark Logic Tests

// This list should be kept in sync with RCTRootViewIntegrationTestsApp.js

// Simple size flexibility tests - test if the content is measured properly
RCT_TEST_DATA_CONFIGURATION_BLOCK(SizeFlexibilityUpdateTest, SingleUpdate, none, simpleSizeFlexibilityBlock(RCTNone));
RCT_TEST_DATA_CONFIGURATION_BLOCK(SizeFlexibilityUpdateTest, SingleUpdate, height, simpleSizeFlexibilityBlock(RCTHeight));
RCT_TEST_DATA_CONFIGURATION_BLOCK(SizeFlexibilityUpdateTest, SingleUpdate, width, simpleSizeFlexibilityBlock(RCTWidth));
RCT_TEST_DATA_CONFIGURATION_BLOCK(SizeFlexibilityUpdateTest, SingleUpdate, both, simpleSizeFlexibilityBlock(RCTBoth));

// Consider multiple size flexibility updates in a row. Test if the view's flexibility mode eventually is set to the expected value
RCT_TEST_DATA_CONFIGURATION_BLOCK(SizeFlexibilityUpdateTest, MultipleUpdates, none, multipleSizeFlexibilityUpdatesBlock(RCTNone));
RCT_TEST_DATA_CONFIGURATION_BLOCK(SizeFlexibilityUpdateTest, MultipleUpdates, height, multipleSizeFlexibilityUpdatesBlock(RCTHeight));
RCT_TEST_DATA_CONFIGURATION_BLOCK(SizeFlexibilityUpdateTest, MultipleUpdates, width, multipleSizeFlexibilityUpdatesBlock(RCTWidth));
RCT_TEST_DATA_CONFIGURATION_BLOCK(SizeFlexibilityUpdateTest, MultipleUpdates, both, multipleSizeFlexibilityUpdatesBlock(RCTBoth));

// Test if the 'rootViewDidChangeIntrinsicSize' delegate method is called after the RN app decides internally to resize
RCT_TEST_CONFIGURATION_BLOCK(ReactContentSizeUpdateTest, reactContentSizeUpdateBlock(RCTBoth))

// Test if setting 'appProperties' property updates the RN app
RCT_TEST_CONFIGURATION_BLOCK(PropertiesUpdateTest, ^(RCTRootView *rootView) {
  rootView.appProperties = @{@"markTestPassed":@YES};
})

@end
