/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTUIKit.h> // TODO(macOS GH#774)

#import <React/RCTBridgeModule.h>
#import <React/RCTDefines.h>

typedef NS_ENUM(NSInteger, RCTTestStatus) { RCTTestStatusPending = 0, RCTTestStatusPassed, RCTTestStatusFailed };

@class FBSnapshotTestController;

@interface RCTTestModule : NSObject <RCTBridgeModule>

/**
 * The snapshot test controller for this module.
 */
@property (nonatomic, strong) FBSnapshotTestController *controller;

/**
 * This is the view to be snapshotted.
 */
@property (nonatomic, strong) RCTUIView *view; // TODO(macOS ISS#3536887)

/**
 * This is used to give meaningful names to snapshot image files.
 */
@property (nonatomic, assign) SEL testSelector;

/**
 * This is polled while running the runloop until true.
 */
@property (nonatomic, readonly) RCTTestStatus status;

@property (nonatomic, copy) NSString *testSuffix;

@end
