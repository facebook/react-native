/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <React/RCTDefines.h>
#import <React/RCTPackagerClientResponder.h>

#if RCT_DEV // Only supported in dev mode

@protocol RCTPackagerClientMethod

- (void)handleRequest:(id)params withResponder:(RCTPackagerClientResponder *)responder;
- (void)handleNotification:(id)params;

@end

@interface RCTPackagerClient : NSObject

- (instancetype)initWithURL:(NSURL *)url;
- (void)addHandler:(id<RCTPackagerClientMethod>)handler forMethod:(NSString *)name;
- (void)start;
- (void)stop;

@end

#endif
