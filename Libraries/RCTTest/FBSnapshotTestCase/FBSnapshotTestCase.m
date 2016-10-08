/*
 *  Copyright (c) 2013, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 *
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

- (BOOL)compareSnapshotOfLayer:(CALayer *)layer
      referenceImagesDirectory:(NSString *)referenceImagesDirectory
                    identifier:(NSString *)identifier
                         error:(NSError **)errorPtr
{
  return [self _compareSnapshotOfViewOrLayer:layer
                    referenceImagesDirectory:referenceImagesDirectory
                                  identifier:identifier
                                       error:errorPtr];
}

- (BOOL)compareSnapshotOfView:(UIView *)view
     referenceImagesDirectory:(NSString *)referenceImagesDirectory
                   identifier:(NSString *)identifier
                        error:(NSError **)errorPtr
{
  return [self _compareSnapshotOfViewOrLayer:view
                    referenceImagesDirectory:referenceImagesDirectory
                                  identifier:identifier
                                       error:errorPtr];
}

#pragma mark -
#pragma mark Private API

- (BOOL)_compareSnapshotOfViewOrLayer:(id)viewOrLayer
             referenceImagesDirectory:(NSString *)referenceImagesDirectory
                           identifier:(NSString *)identifier
                                error:(NSError **)errorPtr
{
  _snapshotController.referenceImagesDirectory = referenceImagesDirectory;
  return [_snapshotController compareSnapshotOfViewOrLayer:viewOrLayer
                                                  selector:self.invocation.selector
                                                identifier:identifier
                                                     error:errorPtr];
}

@end
