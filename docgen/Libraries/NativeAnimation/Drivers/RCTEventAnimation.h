/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <React/RCTEventDispatcher.h>

#import "RCTValueAnimatedNode.h"

@interface RCTEventAnimation : NSObject

@property (nonatomic, readonly, weak) RCTValueAnimatedNode *valueNode;

- (instancetype)initWithEventPath:(NSArray<NSString *> *)eventPath
                        valueNode:(RCTValueAnimatedNode *)valueNode;

- (void)updateWithEvent:(id<RCTEvent>)event;

@end
