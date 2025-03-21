/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

#ifdef __cplusplus

#import <jsinspector-modern/network/NetworkReporter.h>

/**
 * [Experimental] An interface for reporting network events to the modern
 * debugger server and Web Performance APIs.
 *
 * This is a helper class wrapping
 * `facebook::react::jsinspector_modern::NetworkReporter`.
 */
@interface RCTInspectorNetworkReporter : NSObject

/**
 * Returns the singleton instance of RCTInspectorNetworkReporter.
 */
+ (instancetype)sharedReporter;
- (instancetype)init NS_UNAVAILABLE;
+ (instancetype)new NS_UNAVAILABLE;
- (instancetype)copy NS_UNAVAILABLE;
- (instancetype)mutableCopy NS_UNAVAILABLE;

- (void)reportRequestStart:(NSNumber *)requestId
                   request:(NSURLRequest *)request
         encodedDataLength:(int)encodedDataLength;
- (void)reportResponseStart:(NSNumber *)requestId response:(NSURLResponse *)response;
- (void)reportResponseEnd:(NSNumber *)requestId encodedDataLength:(int)encodedDataLength;

@end

#endif
