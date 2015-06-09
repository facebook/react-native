/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTDataManager.h"

#import "RCTAssert.h"
#import "RCTConvert.h"
#import "RCTDataQuery.h"
#import "RCTEventDispatcher.h"
#import "RCTHTTPQueryExecutor.h"
#import "RCTLog.h"
#import "RCTUtils.h"

@implementation RCTDataManager

@synthesize bridge = _bridge;

RCT_EXPORT_MODULE()

/**
 * Executes a network request.
 * The responseSender block won't be called on same thread as called.
 */
RCT_EXPORT_METHOD(queryData:(NSString *)queryType
                  withQuery:(NSDictionary *)query
                  sendIncrementalUpdates:(BOOL)incrementalUpdates
                  responseSender:(RCTResponseSenderBlock)responseSender)
{
  id<RCTDataQueryExecutor> executor = nil;
  if ([queryType isEqualToString:@"http"]) {
    executor = [RCTHTTPQueryExecutor sharedInstance];
  } else {
    RCTLogError(@"unsupported query type %@", queryType);
    return;
  }

  RCTAssert(executor != nil, @"executor must be defined");

  if ([executor respondsToSelector:@selector(setBridge:)]) {
    executor.bridge = _bridge;
  }
  if ([executor respondsToSelector:@selector(setSendIncrementalUpdates:)]) {
    executor.sendIncrementalUpdates = incrementalUpdates;
  }
  [executor addQuery:query responseSender:responseSender];
}

@end
