/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <React/RCTPackagerClient.h>

@class RCTBridge;

#if RCT_DEV // Only supported in dev mode

NS_ASSUME_NONNULL_BEGIN

typedef void (^RCTReloadPackagerMethodBlock)(id);

@interface RCTReloadPackagerMethod : NSObject <RCTPackagerClientMethod>

- (instancetype)initWithReloadCommand:(RCTReloadPackagerMethodBlock)block callbackQueue:(dispatch_queue_t)callbackQueue;

@end

NS_ASSUME_NONNULL_END

#endif
