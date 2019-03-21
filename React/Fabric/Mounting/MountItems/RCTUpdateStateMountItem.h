/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <React/RCTMountItemProtocol.h>
#import <React/RCTPrimitives.h>
#import <react/core/State.h>

NS_ASSUME_NONNULL_BEGIN

/**
 * Updates state of a component view.
 */
@interface RCTUpdateStateMountItem : NSObject <RCTMountItemProtocol>

- (instancetype)initWithTag:(ReactTag)tag
                   oldState:(facebook::react::State::Shared)oldState
                   newState:(facebook::react::State::Shared)newState;

@end

NS_ASSUME_NONNULL_END
