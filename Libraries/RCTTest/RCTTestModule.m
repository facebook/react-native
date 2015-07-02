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
#import "RCTEventDispatcher.h"
#import "RCTLog.h"
#import "RCTUIManager.h"

@implementation RCTTestModule
{
  NSMutableDictionary *_snapshotCounter;
}

@synthesize bridge = _bridge;

RCT_EXPORT_MODULE()

- (dispatch_queue_t)methodQueue
{
  return _bridge.uiManager.methodQueue;
}

- (instancetype)init
{
  if ((self = [super init])) {
    _snapshotCounter = [NSMutableDictionary new];
  }
  return self;
}

RCT_EXPORT_METHOD(verifySnapshot:(RCTResponseSenderBlock)callback)
{
  RCTAssert(_controller != nil, @"No snapshot controller configured.");

  [_bridge.uiManager addUIBlock:^(RCTUIManager *uiManager, RCTSparseArray *viewRegistry) {

    NSString *testName = NSStringFromSelector(_testSelector);
    _snapshotCounter[testName] = [@([_snapshotCounter[testName] integerValue] + 1) stringValue];

    NSError *error = nil;
    BOOL success = [_controller compareSnapshotOfView:_view
                                             selector:_testSelector
                                           identifier:_snapshotCounter[testName]
                                                error:&error];
    callback(@[@(success)]);
  }];
}

RCT_EXPORT_METHOD(sendAppEvent:(NSString *)name body:(nullable id)body)
{
  [_bridge.eventDispatcher sendAppEventWithName:name body:body];
}

RCT_REMAP_METHOD(shouldResolve, shouldResolve_resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject)
{
  resolve(@1);
}

RCT_REMAP_METHOD(shouldReject, shouldReject_resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject)
{
  reject(nil);
}

RCT_EXPORT_METHOD(markTestCompleted)
{
  [self markTestPassed:YES];
}

RCT_EXPORT_METHOD(markTestPassed:(BOOL)success)
{
  [_bridge.uiManager addUIBlock:^(RCTUIManager *uiManager, RCTSparseArray *viewRegistry) {
    _status = success ? RCTTestStatusPassed : RCTTestStatusFailed;
  }];
}

@end
