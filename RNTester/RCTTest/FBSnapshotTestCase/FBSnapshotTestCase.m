/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "FBSnapshotTestCase.h"

#import "FBSnapshotTestController.h"

@interface FBSnapshotTestCase ()

@property (readwrite, nonatomic, retain) FBSnapshotTestController *snapshotController;

@end

@implementation FBSnapshotTestCase

- (void)setUp
{
  [super setUp];
  self.snapshotController = [[FBSnapshotTestController alloc] initWithTestName:NSStringFromClass([self class])];
}

- (void)tearDown
{
  self.snapshotController = nil;
  [super tearDown];
}

- (BOOL)recordMode
{
  return self.snapshotController.recordMode;
}

- (void)setRecordMode:(BOOL)recordMode
{
  self.snapshotController.recordMode = recordMode;
}

- (BOOL)compareSnapshotOfView:(UIView *)view
     referenceImagesDirectory:(NSString *)referenceImagesDirectory
                   identifier:(NSString *)identifier
                        error:(NSError **)errorPtr
{
  _snapshotController.referenceImagesDirectory = referenceImagesDirectory;
  return [_snapshotController compareSnapshotOfView:view
                                           selector:self.invocation.selector
                                         identifier:identifier
                                              error:errorPtr];
}

@end
