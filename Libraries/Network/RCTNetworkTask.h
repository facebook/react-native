/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <Foundation/Foundation.h>

#import "RCTURLRequestDelegate.h"
#import "RCTURLRequestHandler.h"

typedef void (^RCTURLRequestCompletionBlock)(NSURLResponse *response, NSData *data, NSError *error);
typedef void (^RCTURLRequestCancellationBlock)(void);
typedef void (^RCTURLRequestIncrementalDataBlock)(NSData *data);
typedef void (^RCTURLRequestProgressBlock)(int64_t progress, int64_t total);
typedef void (^RCTURLRequestResponseBlock)(NSURLResponse *response);

typedef NS_ENUM(NSInteger, RCTNetworkTaskStatus) {
  RCTNetworkTaskPending = 0,
  RCTNetworkTaskInProgress,
  RCTNetworkTaskFinished,
};

@interface RCTNetworkTask : NSObject <RCTURLRequestDelegate>

@property (nonatomic, readonly) NSURLRequest *request;
@property (nonatomic, readonly) NSNumber *requestID;
@property (nonatomic, readonly, weak) id requestToken;
@property (nonatomic, readonly) NSURLResponse *response;
@property (nonatomic, readonly) RCTURLRequestCompletionBlock completionBlock;

@property (nonatomic, copy) RCTURLRequestProgressBlock downloadProgressBlock;
@property (nonatomic, copy) RCTURLRequestIncrementalDataBlock incrementalDataBlock;
@property (nonatomic, copy) RCTURLRequestResponseBlock responseBlock;
@property (nonatomic, copy) RCTURLRequestProgressBlock uploadProgressBlock;

@property (nonatomic, readonly) RCTNetworkTaskStatus status;

- (instancetype)initWithRequest:(NSURLRequest *)request
                        handler:(id<RCTURLRequestHandler>)handler
                completionBlock:(RCTURLRequestCompletionBlock)completionBlock NS_DESIGNATED_INITIALIZER;

- (void)start;
- (void)cancel;

@end
