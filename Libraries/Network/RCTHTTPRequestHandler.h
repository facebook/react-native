/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTURLRequestHandler.h"
#import "RCTInvalidating.h"
#import "RCTConvert.h"

/**
 * This is the default RCTURLRequestHandler implementation for HTTP requests.
 */
@interface RCTHTTPRequestHandler : NSObject <RCTURLRequestHandler, RCTInvalidating>

- (void)setCachePolicy:(NSURLRequestCachePolicy)cachePolicy;

@end

@interface RCTConvert(RCTRequestCachePolicy)

+ (NSURLRequestCachePolicy)NSURLRequestCachePolicy:(id)json;

@end
