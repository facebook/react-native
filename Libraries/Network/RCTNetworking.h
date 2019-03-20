/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTEventEmitter.h>
#import <React/RCTNetworkTask.h>
#import <React/RCTURLRequestHandler.h>

@protocol RCTNetworkingRequestHandler <NSObject>

// @lint-ignore FBOBJCUNTYPEDCOLLECTION1
- (BOOL)canHandleNetworkingRequest:(NSDictionary *)data;
// @lint-ignore FBOBJCUNTYPEDCOLLECTION1
- (NSDictionary *)handleNetworkingRequest:(NSDictionary *)data;

@end

@protocol RCTNetworkingResponseHandler <NSObject>

- (BOOL)canHandleNetworkingResponse:(NSString *)responseType;
- (id)handleNetworkingResponse:(NSURLResponse *)response data:(NSData *)data;

@end

@interface RCTNetworking : RCTEventEmitter

/**
 * Allows RCTNetworking instances to be initialized with handlers.
 * The handlers will be requested via the bridge's moduleForName method when required.
 */
- (instancetype)initWithHandlersProvider:(NSArray<id<RCTURLRequestHandler>> * (^)(void))getHandlers;

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

- (void)addRequestHandler:(id<RCTNetworkingRequestHandler>)handler;

- (void)addResponseHandler:(id<RCTNetworkingResponseHandler>)handler;

- (void)removeRequestHandler:(id<RCTNetworkingRequestHandler>)handler;

- (void)removeResponseHandler:(id<RCTNetworkingResponseHandler>)handler;

@end

@interface RCTBridge (RCTNetworking)

@property (nonatomic, readonly) RCTNetworking *networking;

@end
