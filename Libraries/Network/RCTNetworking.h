/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <Foundation/Foundation.h>

#import "RCTBridge.h"
#import "RCTDownloadTask.h"

@interface RCTNetworking : NSObject <RCTBridgeModule>

- (RCTDownloadTask *)downloadTaskWithRequest:(NSURLRequest *)request
                             completionBlock:(RCTURLRequestCompletionBlock)completionBlock;

@end

@interface RCTBridge (RCTNetworking)

@property (nonatomic, readonly) RCTNetworking *networking;

@end
