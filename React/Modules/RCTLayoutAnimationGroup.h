/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <UIKit/UIKit.h>

#import <React/RCTBridgeModule.h>

@class RCTLayoutAnimation;

@interface RCTLayoutAnimationGroup : NSObject

@property (nonatomic, readonly) RCTLayoutAnimation *creatingLayoutAnimation;
@property (nonatomic, readonly) RCTLayoutAnimation *updatingLayoutAnimation;
@property (nonatomic, readonly) RCTLayoutAnimation *deletingLayoutAnimation;

@property (nonatomic, copy) RCTResponseSenderBlock callback;

- (instancetype)initWithCreatingLayoutAnimation:(RCTLayoutAnimation *)creatingLayoutAnimation
                        updatingLayoutAnimation:(RCTLayoutAnimation *)updatingLayoutAnimation
                        deletingLayoutAnimation:(RCTLayoutAnimation *)deletingLayoutAnimation
                                       callback:(RCTResponseSenderBlock)callback;

- (instancetype)initWithConfig:(NSDictionary *)config
                      callback:(RCTResponseSenderBlock)callback;

@end
