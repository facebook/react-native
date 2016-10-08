/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTEventEmitter.h"
#import "RCTNetworkTask.h"

@interface RCTNetworking : RCTEventEmitter

/**
 * Does a handler exist for the specified request?
 */
- (BOOL)canHandleRequest:(NSURLRequest *)request;

/**
 * Return an RCTNetworkTask for the specified request. This is useful for
 * invoking the React Native networking stack from within native code.
 */
- (RCTNetworkTask *)networkTaskWithRequest:(NSURLRequest *)request
                           completionBlock:(RCTURLRequestCompletionBlock)completionBlock;

@end

@interface RCTBridge (RCTNetworking)

@property (nonatomic, readonly) RCTNetworking *networking;

@end
