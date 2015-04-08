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

@implementation RCTTestModule
{
  __weak FBSnapshotTestController *_snapshotController;
  __weak UIView *_view;
  NSMutableDictionary *_snapshotCounter;
}

RCT_EXPORT_MODULE()

- (instancetype)initWithSnapshotController:(FBSnapshotTestController *)controller view:(UIView *)view
{
  if ((self = [super init])) {
    _snapshotController = controller;
    _view = view;
    _snapshotCounter = [NSMutableDictionary new];
  }
  return self;
}

RCT_EXPORT_METHOD(verifySnapshot:(RCTResponseSenderBlock)callback)
{
  if (!_snapshotController) {
    RCTLogWarn(@"No snapshot controller configured.");
    callback(@[]);
    return;
  }

  dispatch_async(dispatch_get_main_queue(), ^{
    NSString *testName = NSStringFromSelector(_testSelector);
    _snapshotCounter[testName] = @([_snapshotCounter[testName] integerValue] + 1);
    NSError *error = nil;
    BOOL success = [_snapshotController compareSnapshotOfView:_view
                                                     selector:_testSelector
                                                   identifier:[_snapshotCounter[testName] stringValue]
                                                        error:&error];
    RCTAssert(success, @"Snapshot comparison failed: %@", error);
    callback(@[]);
  });
}

RCT_EXPORT_METHOD(markTestCompleted)
{
  dispatch_async(dispatch_get_main_queue(), ^{
    _done = YES;
  });
}

@end
