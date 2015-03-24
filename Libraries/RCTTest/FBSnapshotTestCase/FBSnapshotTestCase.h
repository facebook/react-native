/*
 *  Copyright (c) 2013, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 *
 */

#import <QuartzCore/QuartzCore.h>

#import <UIKit/UIKit.h>

#import <XCTest/XCTest.h>

#ifndef FB_REFERENCE_IMAGE_DIR
#define FB_REFERENCE_IMAGE_DIR "\"$(SOURCE_ROOT)/$(PROJECT_NAME)Tests/ReferenceImages\""
#endif

/**
 Similar to our much-loved XCTAssert() macros. Use this to perform your test. No need to write an explanation, though.
 @param view The view to snapshot
 @param identifier An optional identifier, used if there are multiple snapshot tests in a given -test method.
 @param referenceImageDirectorySuffix An optional suffix, appended to the reference image directory path, such as "_iOS8"
 */
#define FBSnapshotVerifyViewWithReferenceDirectorySuffix(view__, identifier__, referenceImagesDirectorySuffix__) \
{ \
NSError *error__ = nil; \
NSString *referenceImagesDirectory__ = [NSString stringWithFormat:@"%s%@", FB_REFERENCE_IMAGE_DIR, referenceImagesDirectorySuffix__]; \
BOOL comparisonSuccess__ = [self compareSnapshotOfView:(view__) referenceImagesDirectory:referenceImagesDirectory__ identifier:(identifier__) error:&error__]; \
XCTAssertTrue(comparisonSuccess__, @"Snapshot comparison failed: %@", error__); \
}

#define FBSnapshotVerifyView(view__, identifier__) \
{ \
FBSnapshotVerifyViewWithReferenceDirectorySuffix(view__, identifier__, @""); \
}

/**
 Similar to our much-loved XCTAssert() macros. Use this to perform your test. No need to write an explanation, though.
 @param layer The layer to snapshot
 @param identifier An optional identifier, used is there are multiple snapshot tests in a given -test method.
 @param referenceImageDirectorySuffix An optional suffix, appended to the reference image directory path, such as "_iOS8"
 */
#define FBSnapshotVerifyLayerWithReferenceDirectorySuffix(layer__, identifier__, referenceImagesDirectorySuffix__) \
{ \
NSError *error__ = nil; \
NSString *referenceImagesDirectory__ = [NSString stringWithFormat:@"%s%@", FB_REFERENCE_IMAGE_DIR, referenceImagesDirectorySuffix__]; \
BOOL comparisonSuccess__ = [self compareSnapshotOfLayer:(layer__) referenceImagesDirectory:referenceImagesDirectory__ identifier:(identifier__) error:&error__]; \
XCTAssertTrue(comparisonSuccess__, @"Snapshot comparison failed: %@", error__); \
}

#define FBSnapshotVerifyLayer(layer__, identifier__) \
{ \
FBSnapshotVerifyLayerWithReferenceDirectorySuffix(layer__, identifier__, @""); \
}

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
 Performs the comparisong or records a snapshot of the layer if recordMode is YES.
 @param layer The Layer to snapshot
 @param referenceImagesDirectory The directory in which reference images are stored.
 @param identifier An optional identifier, used if there are multiple snapshot tests in a given -test method.
 @param error An error to log in an XCTAssert() macro if the method fails (missing reference image, images differ, etc).
 @returns YES if the comparison (or saving of the reference image) succeeded.
 */
- (BOOL)compareSnapshotOfLayer:(CALayer *)layer
      referenceImagesDirectory:(NSString *)referenceImagesDirectory
                    identifier:(NSString *)identifier
                         error:(NSError **)errorPtr;

/**
 Performs the comparisong or records a snapshot of the view if recordMode is YES.
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
