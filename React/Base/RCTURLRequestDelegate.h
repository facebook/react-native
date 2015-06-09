/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <Foundation/Foundation.h>

/**
 * An abstract interface used by request handler modules to send
 * data back over the bridge back to JS.
 */
@protocol RCTURLRequestDelegate <NSObject>

/**
 * Call this when you first receives a response from the server. This should
 * include response headers, etc.
 */
- (void)URLRequest:(id)requestToken didReceiveResponse:(NSURLResponse *)response;

/**
 * Call this when you receive data from the server. This can be called multiple
 * times with partial data chunks, or just once with the full data packet.
 */
- (void)URLRequest:(id)requestToken didReceiveData:(NSData *)data;

/**
 * Call this when the request is complete and/or if an error is encountered.
 * For a successful request, the error parameter should be nil.
 */
- (void)URLRequest:(id)requestToken didCompleteWithError:(NSError *)error;

@end
