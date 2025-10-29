/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTNetworking.h"

@protocol RCTNetworkingTextResponseHandler <NSObject>

- (BOOL)canHandleNetworkingTextResponseForRequest:(NSURLRequest *)request;
- (void)handleNetworkingResponseText:(NSString *)responseText request:(NSURLRequest *)request;

@end

@interface RCTNetworking (Internal)

- (void)addTextResponseHandler:(id<RCTNetworkingTextResponseHandler>)handler;

@end
