/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTBridgeModule.h"

@protocol RCTDataQueryExecutor <NSObject>

- (void)addQuery:(NSDictionary *)query responseSender:(RCTResponseSenderBlock)responseSender;

@optional

@property (nonatomic, weak) RCTBridge *bridge;
@property (nonatomic, assign) BOOL sendIncrementalUpdates;

@end
