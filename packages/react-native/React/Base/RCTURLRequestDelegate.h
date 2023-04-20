/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

/**
 * An abstract interface used by request handler modules to send
 * data back over the bridge back to JS.
 */
@protocol RCTURLRequestDelegate <NSObject>

/**
 * Call this when you send request data to the server. This is used to track
 * upload progress, so should be called multiple times for large request bodies.
 */
- (void)URLRequest:(id)requestToken didSendDataWithProgress:(int64_t)bytesSent;

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
