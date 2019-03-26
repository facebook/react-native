/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTEventDispatcher.h>

#import "RCTValueAnimatedNode.h"

@interface RCTEventAnimation : NSObject

@property (nonatomic, readonly, weak) RCTValueAnimatedNode *valueNode;

- (instancetype)initWithEventPath:(NSArray<NSString *> *)eventPath
                        valueNode:(RCTValueAnimatedNode *)valueNode;

- (void)updateWithEvent:(id<RCTEvent>)event;

@end
