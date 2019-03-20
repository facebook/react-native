/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
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
