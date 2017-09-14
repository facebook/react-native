/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <React/RCTEventDispatcher.h>

/**
 * Generic untyped event for Components. Used internally by RCTDirectEventBlock and
 * RCTBubblingEventBlock, for other use cases prefer using a class that implements
 * RCTEvent to have a type safe way to initialize it.
 */
@interface RCTComponentEvent : NSObject<RCTEvent>

- (instancetype)initWithName:(NSString *)name viewTag:(NSNumber *)viewTag body:(NSDictionary *)body;

@end
