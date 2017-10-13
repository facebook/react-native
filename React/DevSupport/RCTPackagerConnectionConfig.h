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

NS_ASSUME_NONNULL_BEGIN

@protocol RCTPackagerClientMethod;

@protocol RCTPackagerConnectionConfig

@property (nonatomic, copy, readonly) NSURL *packagerURL;
@property (nonatomic, copy, readonly) NSDictionary<NSString *, id<RCTPackagerClientMethod>> *defaultPackagerMethods;

@end

NS_ASSUME_NONNULL_END

#endif
