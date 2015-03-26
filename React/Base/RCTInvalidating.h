/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <Foundation/Foundation.h>

// TODO (#5906496): This protocol is only used to add method definitions to
// classes. We should decide if it's actually necessary.

@protocol RCTInvalidating <NSObject>

@property (nonatomic, assign, readonly, getter = isValid) BOOL valid;

- (void)invalidate;

@end
