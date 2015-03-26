/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <Foundation/Foundation.h>

// TODO (#5906496): is there a reason for this protocol? It seems to be
// used in a number of places where it isn't really required - only the
// RCTBridge actually ever calls casts to it - in all other
// cases it is simply a way of adding some method definitions to classes

@protocol RCTInvalidating <NSObject>

@property (nonatomic, assign, readonly, getter = isValid) BOOL valid;

- (void)invalidate;

@end
