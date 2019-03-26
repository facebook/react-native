/*
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

#import <QuartzCore/QuartzCore.h>

#import <UIKit/UIKit.h>

#import <XCTest/XCTest.h>

#ifndef FB_REFERENCE_IMAGE_DIR
#define FB_REFERENCE_IMAGE_DIR "\"$(SOURCE_ROOT)/$(PROJECT_NAME)Tests/ReferenceImages\""
#endif

/**
 The base class of view snapshotting tests. If you have small UI component, it's often easier to configure it in a test
 and compare an image of the view to a reference image that write lots of complex layout-code tests.

 In order to flip the tests in your subclass to record the reference images set `recordMode` to YES before calling
 -[super setUp].
 */
@interface FBSnapshotTestCase : XCTestCase

/**
 When YES, the test macros will save reference images, rather than performing an actual test.
 */
@property (readwrite, nonatomic, assign) BOOL recordMode;

/**
 Performs the comparisons or records a snapshot of the view if recordMode is YES.
 @param view The view to snapshot
 @param referenceImagesDirectory The directory in which reference images are stored.
 @param identifier An optional identifier, used if there are multiple snapshot tests in a given -test method.
 @param error An error to log in an XCTAssert() macro if the method fails (missing reference image, images differ, etc).
 @returns YES if the comparison (or saving of the reference image) succeeded.
 */
- (BOOL)compareSnapshotOfView:(UIView *)view
     referenceImagesDirectory:(NSString *)referenceImagesDirectory
                   identifier:(NSString *)identifier
                        error:(NSError **)errorPtr;

@end
