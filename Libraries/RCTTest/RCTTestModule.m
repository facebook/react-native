/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTTestModule.h"

#import "FBSnapshotTestController.h"
#import "RCTAssert.h"
#import "RCTLog.h"

@implementation RCTTestModule {
  __weak FBSnapshotTestController *_snapshotController;
  __weak UIView *_view;
  NSMutableDictionary *_snapshotCounter;
}

- (instancetype)initWithSnapshotController:(FBSnapshotTestController *)controller view:(UIView *)view
{
  if ((self = [super init])) {
    _snapshotController = controller;
    _view = view;
    _snapshotCounter = [NSMutableDictionary new];
  }
  return self;
}

- (void)verifySnapshot:(RCTResponseSenderBlock)callback
{
  RCT_EXPORT();

  if (!_snapshotController) {
    RCTLogWarn(@"No snapshot controller configured.");
    callback(@[]);
    return;
  }

  NSError *error = nil;
  NSString *testName = NSStringFromSelector(_testSelector);
  _snapshotCounter[testName] = @([_snapshotCounter[testName] integerValue] + 1);
  BOOL success = [_snapshotController compareSnapshotOfView:_view
                                                   selector:_testSelector
                                                 identifier:[_snapshotCounter[testName] stringValue]
                                                      error:&error];
  RCTAssert(success, @"Snapshot comparison failed: %@", error);
  callback(@[]);
}

- (void)markTestCompleted
{
  RCT_EXPORT();

  _done = YES;
}

@end
