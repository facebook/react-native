/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <React/RCTDefines.h>

#if RCT_DEV // Only supported in dev mode

@protocol RCTWebSocketObserverDelegate

- (void)didReceiveWebSocketMessage:(NSDictionary<NSString *, id> *)message;

@end

@interface RCTWebSocketObserver : NSObject

- (instancetype)initWithURL:(NSURL *)url;

@property (nonatomic, weak) id<RCTWebSocketObserverDelegate> delegate;

- (void)start;
- (void)stop;

@end

#endif
