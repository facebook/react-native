/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTBridgeModule.h>
#import <React/RCTURLRequestDelegate.h>

/**
 * Provides the interface needed to register a request handler. Request handlers
 * are also bridge modules, so should be registered using RCT_EXPORT_MODULE().
 */
@protocol RCTURLRequestHandler <RCTBridgeModule>

/**
 * Indicates whether this handler is capable of processing the specified
 * request. Typically the handler would examine the scheme/protocol of the
 * request URL (and possibly the HTTP method and/or headers) to determine this.
 */
- (BOOL)canHandleRequest:(NSURLRequest *)request;

/**
 * Send a network request and call the delegate with the response data. The
 * method should return a token, which can be anything, including the request
 * itself. This will be used later to refer to the request in callbacks. The
 * `sendRequest:withDelegate:` method *must* return before calling any of the
 * delegate methods, or the delegate won't recognize the token.
 * Following common Objective-C pattern, `delegate` will not be retained.
 */
- (id)sendRequest:(NSURLRequest *)request
     withDelegate:(id<RCTURLRequestDelegate>)delegate;

@optional

/**
 * Not all request types can be cancelled, but this method can be implemented
 * for ones that can. It should be used to free up any resources on ongoing
 * processes associated with the request.
 */
- (void)cancelRequest:(id)requestToken;

/**
 * If more than one RCTURLRequestHandler responds YES to `canHandleRequest:`
 * then `handlerPriority` is used to determine which one to use. The handler
 * with the highest priority will be selected. Default priority is zero. If
 * two or more valid handlers have the same priority, the selection order is
 * undefined.
 */
- (float)handlerPriority;

@end
