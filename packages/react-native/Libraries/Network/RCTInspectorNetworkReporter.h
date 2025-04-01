/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#import <Foundation/Foundation.h>

/**
 * [Experimental] An interface for reporting network events to the modern
 * debugger server and Web Performance APIs.
 *
 * In a production (non dev or profiling) build, CDP reporting is disabled.
 *
 * This is a helper class wrapping
 * `facebook::react::jsinspector_modern::NetworkReporter`.
 */
@interface RCTInspectorNetworkReporter : NSObject

+ (void)reportRequestStart:(NSNumber *)requestId
                   request:(NSURLRequest *)request
         encodedDataLength:(int)encodedDataLength;
+ (void)reportResponseStart:(NSNumber *)requestId
                   response:(NSURLResponse *)response
                 statusCode:(int)statusCode
                    headers:(NSDictionary<NSString *, NSString *> *)headers;
+ (void)reportResponseEnd:(NSNumber *)requestId encodedDataLength:(int)encodedDataLength;

@end
